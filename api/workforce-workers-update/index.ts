import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface EditWorkerInput {
    roleTypeIds: any;
    workerStatusTypesId: number;
    updatedBy: number;
}

async function isValidUserId(userId: number): Promise<boolean> {
    if (userId <= 0) {
        return false; // Assuming IDs are positive integers
    }

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

async function isValidWorkerId(workerId: number): Promise<boolean> {
    if (workerId <= 0) {
        return false; // Assuming IDs are positive integers
    }

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, workerId)
            .query(`SELECT COUNT(1) AS count FROM field_tracker.workers WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking if workerId is valid:`, error);
        // Error caught and logged, proceed to return false
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

async function validateRoleTypeId(roleTypeIds: any) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .query(`SELECT id FROM field_tracker.worker_role_types`);
    
    const validRoleTypeIds = result.recordset.map(item => item.id);

    if (roleTypeIds.some((roleTypeId: any) => validRoleTypeIds.some((roleType: any) => { roleType.id == roleTypeId }))) {
        return false;
    } else return true;
}

async function fetchWorkerRoleAssignments(workerId: number) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .input('workerId', sql.Int, workerId)
        .query(`SELECT * FROM field_tracker.worker_role_assignments WHERE worker_id = @workerId`);
        
    return result.recordset;
}

function checkForInsertValid(workerRoleAssignments: any, roleTypeIds: any) {
    let forInsert: any = [];
    let forChecking: any = [];

    const roleAssignments = workerRoleAssignments.map((wra: any) => wra.worker_role_type_id);

    roleTypeIds.forEach((typeId: any) => {
        if (!roleAssignments.includes(typeId)) forInsert.push(typeId);
        else forChecking.push(typeId);
    });

    return {
        forInsert,
        forChecking
    };
}

function checkForReactivationValid(workerRoleAssignments: any, roleTypeIds: any) {
    let forReactivation: any = [];

    const inactiveWRA = workerRoleAssignments.filter((wra: any) => !wra.is_active);
    const roleAssignments = inactiveWRA.map((wra: any) => wra.worker_role_type_id);

    roleTypeIds.forEach((typeId: any) => {
        if (roleAssignments.includes(typeId)) forReactivation.push(typeId);
    });

    return roleTypeIds;
}

function checkForRemoveValid(workerRoleAssignments: any, roleTypeIds: any) {
    let forDelete: any = [];

    const roleAssignments = workerRoleAssignments.map((wra: any) => wra.worker_role_type_id);
    
    roleAssignments.forEach((roleAssignmentId: any) => {
        if (!roleTypeIds.includes(roleAssignmentId)) {
            forDelete.push(roleAssignmentId);
        }
    });

    return forDelete;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to add a new worker.');

    const workerData = req.body as EditWorkerInput;
    const workerId = context.bindingData.workerId;

    context.res = {
        status: 400,
        body: workerData
    };
    
    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const validateUserId = await isValidUserId(workerData.updatedBy);
    if (!validateUserId) {
        context.res = {
            status: 400,
            body: "Invalid user ID."
        };
        return;
    }

    const validateWorkerId = await isValidWorkerId(workerId);
    if (!validateWorkerId) {
        context.res = {
            status: 400,
            body: "Invalid worker ID."
        };
        return;
    }

    const isValidRoleTyeps = await validateRoleTypeId(workerData.roleTypeIds);
    if (!isValidRoleTyeps) {
        context.res = {
            status: 400,
            body: "Some scope types are not valid."
        };
        return;
    }

    const workerRoleAssignments = await fetchWorkerRoleAssignments(workerId);
    const forInsertTypes = checkForInsertValid(workerRoleAssignments, workerData.roleTypeIds);
    const forReactivateTypes = checkForReactivationValid(workerRoleAssignments, forInsertTypes.forChecking);
    const forRemoveTypes = checkForRemoveValid(workerRoleAssignments, workerData.roleTypeIds);
    

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateWorkerQuery = `
        UPDATE field_tracker.workers
        SET status_id = @statusId,
            updated_by = @updatedBy
        WHERE id = @workerId
    `;

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        
        await request
            .input('statusId', sql.Int, workerData.workerStatusTypesId)
            .input('updatedBy', sql.Int, workerData.updatedBy)
            .input('workerId', sql.Int, workerId)
            .query(updateWorkerQuery);

        // Process worker role types that needs to be inserted
        for (const workerRoleTypeId of forInsertTypes.forInsert) {
            const insertRoleAssignmentQuery = `
                INSERT INTO field_tracker.worker_role_assignments (worker_id, worker_role_type_id, created_by)
                VALUES (@workerId, @workerRoleTypeId, @createdBy);
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('workerId', sql.Int, workerId)
                .input('workerRoleTypeId', sql.Int, workerRoleTypeId)
                .input('createdBy', sql.Int, workerData.updatedBy)
                .query(insertRoleAssignmentQuery);
        }

        // Process worker role types that needs to be reactivated
        for (const workerRoleTypeId of forReactivateTypes) {
            const reactivateScopeAssignmentQuery = `
                UPDATE field_tracker.worker_role_assignments
                SET is_active = 1,
                    updated_at = @updatedAt,
                    updated_by = @updatedBy
                WHERE worker_role_type_id = @workerRoleTypeId
                AND worker_id = @workerId;
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('workerId', sql.Int, workerId)
                .input('workerRoleTypeId', sql.Int, workerRoleTypeId)
                .input('updatedBy', sql.Int, workerData.updatedBy)
                .input('updatedAt', sql.DateTime, new Date())
                .query(reactivateScopeAssignmentQuery);
        }

        // Process worker role types that needs to be removed
        for (const workerRoleTypeId of forRemoveTypes) {
            const removeScopeAssignmentQuery = `
                UPDATE field_tracker.worker_role_assignments
                SET is_active = 0,
                    updated_at = @updatedAt,
                    updated_by = @updatedBy
                WHERE worker_role_type_id = @workerRoleTypeId
                AND worker_id = @workerId;
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('workerId', sql.Int, workerId)
                .input('workerRoleTypeId', sql.Int, workerRoleTypeId)
                .input('updatedBy', sql.Int, workerData.updatedBy)
                .input('updatedAt', sql.DateTime, new Date())
                .query(removeScopeAssignmentQuery);
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