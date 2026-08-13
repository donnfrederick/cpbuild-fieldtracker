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
    const workerId = context.bindingData.workerId;

    const isValidWorkHourSubmissionId = await isValidId(workHourSubmissionId, "field_tracker.work_hour_submissions");
    if (!isValidWorkHourSubmissionId) {
        context.res = {
            status: 400,
            body: "Invalid workHourSubmissionId."
        };
        return;
    }

    const isValidWorkerId = await isValidId(workerId, "field_tracker.workers");
    if (!isValidWorkerId) {
        context.res = {
            status: 400,
            body: "Invalid workerId."
        };
        return;
    }

    const isValidUpdatedBy = await isValidId(req.body.updatedBy, "dbo.users");
    if (!isValidUpdatedBy) {
        context.res = {
            status: 400,
            body: "Invalid updatedBy."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    let updateQuery = `
        UPDATE field_tracker.work_hour_submissions
        SET
            updated_at = @updatedAt,
            updated_by = @updatedBy
    `;

    if (req.body.hours != null) {
        updateQuery += `,
            hours = @hours
        `;
    }

    if (req.body.quantity != null) {
        updateQuery += `,
            quantity = @quantity
        `;
    }

    if (req.body.submissionNotes != null) {
        updateQuery += `,
            submission_notes = @submissionNotes
        `;
    }

    updateQuery += `
        WHERE id = @workHourSubmissionId;
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        if (req.body.hours != null) {
            request.input('hours', sql.Decimal(10, 2), req.body.hours);
        }

        if (req.body.quantity != null) {
            request.input('quantity', sql.Int, req.body.quantity);
        }

        if (req.body.submissionNotes != null) {
            request.input('submissionNotes', sql.NVarChar, req.body.submissionNotes);
        }

        request.input('workHourSubmissionId', sql.Int, workHourSubmissionId)
            .input('updatedAt', sql.DateTime, new Date())
            .input('updatedBy', sql.Int, req.body.updatedBy);

        await request
            .query(updateQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: {
                message: `Successfully Updated`
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
