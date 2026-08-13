import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get all eligible users to be a team lead.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            id,
            name
        FROM dbo.users
        WHERE id NOT IN (SELECT user_id FROM field_tracker.team_leads)
            AND active = 1;
        `;

    try {
        const request = pool.request();
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 200,
                body: 'No eligible user to be a team lead found.'
            };
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
