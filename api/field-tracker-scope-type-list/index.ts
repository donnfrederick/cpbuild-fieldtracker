import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get all active scope types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const getActiveScopeTypesQuery = `
        SELECT
            id,
            scope_name,
            ihi_enabled,
            sort_order
        FROM
            field_tracker.scope_types
        WHERE
            is_active = 1
        ORDER BY
            sort_order ASC
    `;

    try {
        const request = pool.request();
        const result = await request.query(getActiveScopeTypesQuery);

        if (result.recordset.length > 0) {
            context.log(`Found ${result.recordset.length} active scope types.`);
            context.res = {
                body: result.recordset
            };
        } else {
            context.log('No active scope types found.');
            context.res = {
                status: 404,
                body: 'No active scope types found.'
            };
        }
    } catch (error) {
        context.log(`Error occurred retrieving active scope types: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: `Error occurred retrieving active scope types: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
