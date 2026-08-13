import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to check if user is a worker.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const userId = context.bindingData.userId;

    const query = `
        SELECT
            w.id,
            w.user_id AS userId,
            u.name,
            u.email
        FROM field_tracker.workers w
        JOIN dbo.users u
            ON w.user_id = u.id
        WHERE u.id = @userId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('userId', sql.Int, userId)
            .query(query);
        let body = null;

        if (result.recordset.length > 0) {
            body = result.recordset[0];
        }

        context.res = {
            status: 200,
            body
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
