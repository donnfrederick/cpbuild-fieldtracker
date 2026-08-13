import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get a list of location types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const getLocationTypesQuery = `
        SELECT
            id,
            lt.location_type_name as locationTypeName,
            lt.location_type_description as locationTypeDescription
        FROM field_tracker.location_types lt
    `;

    try {
        const result = await pool?.request().query(getLocationTypesQuery);

        if (result?.recordset.length) {
            context.log(`Found ${result.recordset.length} location types`);
            context.res = {
                body: result.recordset
            };
        } else {
            context.log("No location types found");
            context.res = {
                status: 404,
                body: "No location types found"
            };
        }
    } catch (error) {
        context.log(`Error occurred retrieving all location types: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: `Error occurred while retrieving all location types: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;