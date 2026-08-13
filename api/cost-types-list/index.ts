import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get a list of cost types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const getCostTypesQuery = `
        SELECT
            ct.id,
            ct.cost_type_name as costTypeName,
            ct.cost_type_description as costTypeDescription,
            ct.cost_type_definition as costTypeDefinition
        FROM field_tracker.cost_types ct
    `;

    try {
        const result = await pool?.request().query(getCostTypesQuery);

        if (result?.recordset.length) {
            context.log(`Found ${result.recordset.length} cost types`);
            context.res = {
                body: result.recordset
            };
        } else {
            context.log("No cost types found");
            context.res = {
                status: 404,
                body: "No cost types found"
            };
        }
    } catch (error) {
        context.log(`Error occurred retrieving all cost types: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: `Error occurred while retrieving all cost types: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;