import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface NewProjectByScopeInput {
    projectId: number,
    scopeTypeId: number,
    statusId: number,
    teamLeadId: number,
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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create projects by scope.');

    const projectData = req.body as NewProjectByScopeInput;

    const isValidProjectId = await isValidId(projectData.projectId, "field_tracker.projects");
    if (!isValidProjectId) {
        context.res = {
            status: 400,
            body: "Invalid project ID."
        };
        return;
    }

    const isValidScopeTypeId = await isValidId(projectData.scopeTypeId, "field_tracker.scope_types");
    if (!isValidScopeTypeId) {
        context.res = {
            status: 400,
            body: "Invalid scope type ID."
        };
        return;
    }

    const isValidStatusId = await isValidId(projectData.statusId, "field_tracker.projects_by_scope_status_types");
    if (!isValidStatusId) {
        context.res = {
            status: 400,
            body: "Invalid scope status types ID."
        };
        return;
    }

    const isValidCreatedBy = await isValidId(projectData.createdBy, "dbo.users");
    if (!isValidCreatedBy) {
        context.res = {
            status: 400,
            body: "Invalid user ID."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertProjectByScopeQuery = `
        INSERT INTO field_tracker.projects_by_scope (project_id, scope_type_id, status_id, team_lead_id, created_by)
        OUTPUT INSERTED.id
        VALUES (@projectId, @scopeTypeId, @statusId, @teamLeadId, @createdBy);
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        const ihiProjectRowResult = await request
            .input('projectId', sql.Int, projectData.projectId)
            .input('scopeTypeId', sql.Int, projectData.scopeTypeId)
            .input('statusId', sql.Int, projectData.statusId)
            .input('teamLeadId', sql.Int, projectData.teamLeadId)
            .input('createdBy', sql.Int, projectData.createdBy)
            .query(insertProjectByScopeQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `IHI Project have been added`, projectByScopeId: ihiProjectRowResult.recordset[0].id }
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
