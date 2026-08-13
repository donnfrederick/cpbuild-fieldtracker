import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getBlobProperties } from "../services/azureBlobStorageService";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getImageUploadData(sessionId: string): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('sessionId', sql.NVarChar, sessionId)
            .query(`SELECT file_name FROM field_tracker.image_uploads WHERE session_id = @sessionId`);
        return result.recordset[0];
    } catch (error) {
        console.error(`Error retrieving image_uploads entry:`, error);
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to retrieve blob properties.');

    try {
        const sessionId = atob(context.bindingData.sessionId);
        const imageUploadEntry = await getImageUploadData(sessionId);

        const blobProperties = await getBlobProperties(imageUploadEntry.file_name, "dev-images2");

        if (blobProperties.error == null) {
            context.log(blobProperties.data);

            context.res = {
                status: 200,
                body: {
                    message: `Successfully retrieved blob properties`,
                    result: blobProperties.data
                }
            };
        } else {
            context.log(blobProperties.data);

            context.res = {
                status: 500,
                body: "Internal Server Error: " + blobProperties.message
            };
        }
    } catch (error) {
        context.log('Error retrieving blob properties:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
