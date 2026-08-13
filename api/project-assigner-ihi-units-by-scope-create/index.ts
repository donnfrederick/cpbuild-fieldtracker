import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface NewUnitByScopeInput {
    projectByScopeId: number,
    projectId: number,
    projectRowId: number,
    scopeTypeId: number,
    statusId: number,
    createdBy: number
}

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (id <= 0) {
        return false; // Assuming IDs are positive integers
    }

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
        // Error caught and logged, proceed to return false
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

async function getInitialPhaseId(scopeTypeId: number): Promise<number> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool
            .request()
            .input("scopeTypeId", sql.Int, scopeTypeId)
            .query(`
                SELECT id
                FROM field_tracker.unit_phases_by_scope
                WHERE scope_type_id = @scopeTypeId AND phase_order = 1
            `);

        return result.recordset.length > 0 ? result.recordset[0].id : -1;
    } catch (error) {
        console.error("Error fetching current phase ID:", error);
        throw new Error("Database query failed");
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create units by scope.');

    const unitData = req.body as NewUnitByScopeInput;

    const isValidProjectByScopeId = await isValidId(unitData.projectByScopeId, "field_tracker.projects_by_scope");
    if (!isValidProjectByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid project ID."
        };
        return;
    }

    const isValidProjectRowId = await isValidId(unitData.projectRowId, "field_tracker.project_rows");
    if (!isValidProjectRowId) {
        context.res = {
            status: 400,
            body: "Invalid project row ID."
        };
        return;
    }

    const isValidScopeTypeId = await isValidId(unitData.scopeTypeId, "field_tracker.scope_types");
    if (!isValidScopeTypeId) {
        context.res = {
            status: 400,
            body: "Invalid scope type ID."
        };
        return;
    }

    const isValidStatusId = await isValidId(unitData.statusId, "field_tracker.unit_by_scope_status_types");
    if (!isValidStatusId) {
        context.res = {
            status: 400,
            body: "Invalid scope status types ID."
        };
        return;
    }

    const isValidCreatedBy = await isValidId(unitData.createdBy, "dbo.users");
    if (!isValidCreatedBy) {
        context.res = {
            status: 400,
            body: "Invalid user ID."
        };
        return;
    }

    const initialPhaseId = await getInitialPhaseId(unitData.scopeTypeId);
    if (initialPhaseId === -1) {
        context.res = {
            status: 500,
            body: "Failed to fetch initial phase ID."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertProjectByScopeQuery = `
        INSERT INTO field_tracker.units_by_scope (project_by_scope_id, unit_id, current_phase_id, status_id, created_by)
        VALUES (@projectByScopeId, @projectRowId, @currentPhaseId, @statusId, @createdBy);
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        await request
            .input('projectByScopeId', sql.Int, unitData.projectByScopeId)
            .input('projectRowId', sql.Int, unitData.projectRowId)
            .input('currentPhaseId', sql.Int, initialPhaseId)
            .input('statusId', sql.Int, unitData.statusId)
            .input('createdBy', sql.Int, unitData.createdBy)
            .query(insertProjectByScopeQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `IHI Unit have been added` }
        };
    } catch (error) {
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
