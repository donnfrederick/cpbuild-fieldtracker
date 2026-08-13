import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all blocking issue responsible party types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const query = `
        SELECT
            id,
            type_name as name,
            description
        FROM field_tracker.blocking_issue_responsible_party_types
        WHERE is_active = 1;
    `;

    try {
        const request = pool.request();

        const result = await request
            .query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 400,
                body: 'No result found.'
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
