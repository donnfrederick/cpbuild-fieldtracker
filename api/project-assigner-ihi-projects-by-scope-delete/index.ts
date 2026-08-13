import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface DeleteProjectByScopeInput {
    deletedBy: number
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create projects by scope.');

    const projectData = req.body as DeleteProjectByScopeInput;
    const ihiProjectId = context.bindingData.ihiProjectId;

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const deleteProjectByScopeQuery = `
        UPDATE field_tracker.projects_by_scope
        SET deleted_by = @deletedBy,
            deleted_at = @deletedAt
        WHERE id = @ihiProjectId
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        await request
            .input('ihiProjectId', sql.Int, ihiProjectId)
            .input('deletedBy', sql.Int, projectData.deletedBy)
            .input('deletedAt', sql.DateTime, new Date())
            .query(deleteProjectByScopeQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `IHI Project have been deleted` }
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
