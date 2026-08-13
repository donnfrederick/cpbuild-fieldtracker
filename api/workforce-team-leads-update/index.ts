import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface EditTeamLeadInput {
    scopeTypeIds: any;
    workerStatusTypesId: number;
    updatedBy: number;
}

async function validateTeamLeadId(teamLeadId: number): Promise<boolean> {
    if (teamLeadId <= 0) {
        return false; // Assuming IDs are positive integers
    }

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, teamLeadId)
            .query(`SELECT COUNT(1) AS count FROM field_tracker.team_leads WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking if team lead ID is valid:`, error);
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

async function forInsertScopeTypes(teamLeadId: number, scopeTypeIds: any) {
    let forInsertScopeTypes: any = [];
    let forCheckingScopeTypes: any = [];

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .input('teamLeadId', sql.Int, teamLeadId)
        .query(`SELECT scope_type_id FROM field_tracker.team_lead_scope_assignments WHERE team_lead_id = @teamLeadId`);

    const existingScopeType = result.recordset.map((scopeAssignment: any) => scopeAssignment.scope_type_id);

    scopeTypeIds.forEach((scopeTypeId: number) => {
        if (!existingScopeType.includes(scopeTypeId)) {
            forInsertScopeTypes.push(scopeTypeId);
        } else {
            forCheckingScopeTypes.push(scopeTypeId);
        }
    });

    return {
        forInsertScopeTypes,
        forCheckingScopeTypes
    };
}

async function forReactivateScopeTypes(teamLeadId: number, scopeTypeIds: any) {
    let forReactivateScopeTypes: any = [];

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .input('teamLeadId', sql.Int, teamLeadId)
        .query(`SELECT scope_type_id FROM field_tracker.team_lead_scope_assignments WHERE team_lead_id = @teamLeadId AND is_active = 0`);

    const existingScopeType = result.recordset.map((scopeAssignment: any) => scopeAssignment.scope_type_id);

    scopeTypeIds.forEach((scopeTypeId: number) => {
        if (existingScopeType.includes(scopeTypeId)) {
            forReactivateScopeTypes.push(scopeTypeId);
        }
    });

    return forReactivateScopeTypes;
}

async function forUpdateScopeTypes(teamLeadId: number, scopeTypeIds: any) {
    let forUpdateScopeTypes: any = [];

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
        .input('teamLeadId', sql.Int, teamLeadId)
        .query(`SELECT scope_type_id FROM field_tracker.team_lead_scope_assignments WHERE team_lead_id = @teamLeadId`);

    const existingScopeType = result.recordset.map((scopeAssignment: any) => scopeAssignment.scope_type_id);

    existingScopeType.forEach((scopeTypeId: number) => {
        if (!scopeTypeIds.includes(scopeTypeId)) {
            forUpdateScopeTypes.push(scopeTypeId);
        }
    });

    return forUpdateScopeTypes;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to update a team lead.');

    const teamLeadData = req.body as EditTeamLeadInput;
    const teamLeadId = context.bindingData.teamLeadId;

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const isValidTeamLeadId = await validateTeamLeadId(teamLeadId);
    if (!isValidTeamLeadId) {
        context.res = {
            status: 400,
            body: "Invalid team lead ID."
        };
        return;
    }

    const isValidScopeTypes = await validateScopeTypes(teamLeadData.scopeTypeIds);
    if (!isValidScopeTypes) {
        context.res = {
            status: 400,
            body: "Some scope types are invalid."
        };
        return;
    }

    const insertScopeTypes = await forInsertScopeTypes(teamLeadId, teamLeadData.scopeTypeIds);
    const reactivateScopeTypes = await forReactivateScopeTypes(teamLeadId, insertScopeTypes.forCheckingScopeTypes);
    const updateScopeTypes = await forUpdateScopeTypes(teamLeadId, teamLeadData.scopeTypeIds);

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateTeamLeadQuery = `
        UPDATE field_tracker.team_leads
        SET status_id = @statusId,
            updated_by = @updatedBy
        WHERE id = @teamLeadId
    `;

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        
        await request
            .input('statusId', sql.Int, teamLeadData.workerStatusTypesId)
            .input('updatedBy', sql.Int, teamLeadData.updatedBy)
            .input('teamLeadId', sql.Int, teamLeadId)
            .query(updateTeamLeadQuery);

        // Process scope types that needs to be inserted
        for (const scopeTypeId of insertScopeTypes.forInsertScopeTypes) {
            const insertScopeAssignmentQuery = `
                INSERT INTO field_tracker.team_lead_scope_assignments (team_lead_id, scope_type_id, created_by)
                VALUES (@teamLeadId, @scopeTypeId, @createdBy);
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('teamLeadId', sql.Int, teamLeadId)
                .input('scopeTypeId', sql.Int, scopeTypeId)
                .input('createdBy', sql.Int, teamLeadData.updatedBy)
                .query(insertScopeAssignmentQuery);
        }

        // Process scope types that needs to be reactivated
        for (const scopeTypeId of reactivateScopeTypes) {
            const reactivateScopeAssignmentQuery = `
                UPDATE field_tracker.team_lead_scope_assignments
                SET is_active = 1,
                    updated_at = @updatedAt,
                    updated_by = @updatedBy
                WHERE scope_type_id = @scopeTypeId
                AND team_lead_id = @teamLeadId;
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('teamLeadId', sql.Int, teamLeadId)
                .input('scopeTypeId', sql.Int, scopeTypeId)
                .input('updatedBy', sql.Int, teamLeadData.updatedBy)
                .input('updatedAt', sql.DateTime, new Date())
                .query(reactivateScopeAssignmentQuery);
        }

        // Process scope types that needs to be updated/removed
        for (const scopeTypeId of updateScopeTypes) {
            const removeScopeAssignmentQuery = `
                UPDATE field_tracker.team_lead_scope_assignments
                SET is_active = 0,
                    updated_at = @updatedAt,
                    updated_by = @updatedBy
                WHERE scope_type_id = @scopeTypeId
                AND team_lead_id = @teamLeadId;
            `;
            
            const request = new sql.Request(transaction);
            
            await request.input('teamLeadId', sql.Int, teamLeadId)
                .input('scopeTypeId', sql.Int, scopeTypeId)
                .input('updatedBy', sql.Int, teamLeadData.updatedBy)
                .input('updatedAt', sql.DateTime, new Date())
                .query(removeScopeAssignmentQuery);
        }

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `Team leaad have been updated` }
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