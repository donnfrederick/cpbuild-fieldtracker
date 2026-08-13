import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface NewWorkerInput {
    userId: number;
    roleTypesData: any;
    createdBy: number;
}

async function isValidUserId(userId: number): Promise<boolean> {
    if (userId <= 0) {
        return false; // Assuming IDs are positive integers
    }

    const tableName = "dbo.users";

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query(`SELECT COUNT(1) AS count FROM dbo.users WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking if userId is valid:`, error);
        // Error caught and logged, proceed to return false
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

async function validateScopeTypes(scopeTypeIds: any) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .query(`SELECT id FROM field_tracker.scope_types`);
    
    const validScopeTypeIds = result.recordset.map(item => item.id);

    if (scopeTypeIds.some((scopeTypeId: any) => validScopeTypeIds.some((scopeType: any) => { scopeType.id == scopeTypeId }))) {
        return false;
    } else return true;
}

async function getScopeTypes() {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .query(`SELECT id, scope_name FROM field_tracker.scope_types`);

    return result.recordset;
}

async function getRoleTypes() {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .query(`SELECT id, role_type_name, scope_type_id FROM field_tracker.worker_role_types`);

    return result.recordset;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to add a new worker.');

    const workerData = req.body as NewWorkerInput;
    
    const scopeTypes = await getScopeTypes();
    const roleTypes = await getRoleTypes();

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const validateUserId = await isValidUserId(workerData.userId);
    if (!validateUserId) {
        context.res = {
            status: 400,
            body: "Invalid user ID."
        };
        return;
    }

    let scopeTypeIds: any = [];
    let submittedRoleTypes: any = [];

    workerData.roleTypesData.forEach((roleType: any) => {
        if (roleType.isChecked && roleType.roles.length > 0) {
            const scopeTypeId = scopeTypes.find((scopeType: any) => scopeType.scope_name == roleType.scope)?.id;
            scopeTypeIds.push(scopeTypeId);
            roleType.roles.forEach((roleName: string) => {
                const workerRoleTypeId = roleTypes.find((roleType: any) => roleType.role_type_name == roleName && roleType.scope_type_id == scopeTypeId)?.id;
                submittedRoleTypes.push(workerRoleTypeId);
            });
        }
    });

    const isValidScopeTypes = await validateScopeTypes(scopeTypeIds);
    if (!isValidScopeTypes) {
        context.res = {
            status: 400,
            body: "Some scope types are invalid."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertWorkerQuery = `
        INSERT INTO field_tracker.workers (user_id, status_id, created_by)
        OUTPUT INSERTED.id
        VALUES (@userId, @statusId, @createdBy);
    `;

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        
        // Initial query to create the base dbo.projects entry
        const insertWorkerResult = await request
            .input('userId', sql.Int, workerData.userId)
            .input('statusId', sql.Int, 1)
            .input('createdBy', sql.Int, workerData.createdBy)
            .query(insertWorkerQuery);

        const workerId = insertWorkerResult.recordset[0].id;

        for (const workerRoleTypeId of submittedRoleTypes) {
            const insertScopeAssignmentQuery = `
                INSERT INTO field_tracker.worker_role_assignments (worker_id, worker_role_type_id, created_by)
                VALUES (@workerId, @workerRoleTypeId, @createdBy);
            `;
            
            const request = new sql.Request(transaction);
            
            await request
                .input('workerId', sql.Int, workerId)
                .input('workerRoleTypeId', sql.Int, workerRoleTypeId)
                .input('createdBy', sql.Int, workerData.createdBy)
                .query(insertScopeAssignmentQuery);
        }

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `Worker have been added` }
        };

        return;
    } catch (error) {
        // Log the error
        context.log(`Transaction error occurred: ${(error as Error).message}`);

        // Rollback the transaction if it is in progress
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            context.log(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
        }
        
        context.res = {
            status: 500,
            body: {
                message: (error as Error).message
            }
        };

        // Log the error to the error_log table if possible
        if (pool && pool.connected) {
            try {
                await pool.request()
                    .input('errorMessage', sql.NVarChar, (error as Error).message)
                    .input('errorTime', sql.DateTime, new Date())
                    .query(`INSERT INTO dbo.error_log (error_message, error_time) VALUES (@errorMessage, @errorTime)`);
            } catch (loggingError) {
                context.log(`Error occurred while logging error to error_log: ${(loggingError as Error).message}`);
            }
        }
    }
};

export default httpTrigger;