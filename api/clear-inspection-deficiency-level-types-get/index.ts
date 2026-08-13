import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch clear inspection deficiency level types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    try {
        const request = pool.request();

        const result = await request
            .query(`
                SELECT
                    id,
                    name,
                    sort_order,
                    is_active,
                    description
                FROM field_tracker.clear_inspection_deficiency_level_types
                WHERE is_active = 1
            `);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 401,
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
