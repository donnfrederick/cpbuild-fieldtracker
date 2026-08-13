import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get all install teams status types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const query = `
        SELECT
            id,
            status_name as statusName,
            description,
            is_active as isActive
        FROM
            field_tracker.install_teams_status_types
        WHERE
            is_active = 1
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
                status: 404,
                body: 'No status types found.'
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
