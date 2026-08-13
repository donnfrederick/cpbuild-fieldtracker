import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

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
        console.error(`Error checking valid ID in table ${tableName}:`, error);
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to update work hour submission details.');

    const workHourSubmissionId = context.bindingData.workHourSubmissionId;

    const isValidWorkHourSubmissionId = await isValidId(workHourSubmissionId, "field_tracker.work_hour_submissions");
    if (!isValidWorkHourSubmissionId) {
        context.res = {
            status: 400,
            body: "Invalid workHourSubmissionId."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.work_hour_submissions
        SET
            deleted_at = @deletedAt,
            deleted_by = @deletedBy
        WHERE id = @workHourSubmissionId;
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        request.input('workHourSubmissionId', sql.Int, workHourSubmissionId)
            .input('deletedAt', sql.DateTime, new Date())
            .input('deletedBy', sql.Int, req.body.deletedBy);

        await request
            .query(updateQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: {
                message: `Successfully Deleted`
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
