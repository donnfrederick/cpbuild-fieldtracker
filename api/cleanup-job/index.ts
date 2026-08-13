import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { deleteBlob } from "../services/azureBlobStorageService";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function collectExpiredUploads(): Promise<any> {
    const query = `SELECT id, file_name
        FROM field_tracker.image_uploads
        WHERE created_at <= DATEADD(HOUR, -24, GETUTCDATE())
        AND upload_status_id = 1;`;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error(`An error occurred while collecting expired entries in image_uploads table:`, error);
    }
}

async function deleteUpload(id: number) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        const updatequery = `UPDATE field_tracker.image_uploads
            SET upload_status_id = 3
            WHERE id = @id`;

        await request
            .input('id', sql.Int, id)
            .query(updatequery);

        await transaction.commit();
    } catch (error) {
        console.log("An error occurred while deleting an upload entry: ", error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to clean up Azure Blob Storage and image_uploads table.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const expiredUploads = await collectExpiredUploads();

    try {
        for (const uploadEntry of expiredUploads) {
            await deleteUpload(uploadEntry.id);
            await deleteBlob(uploadEntry.file_name, 'dev-images2');
        }

        context.res = {
            status: 200,
            body: {
                message: `Cleanup job have been executed successfully`
            }
        };
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            context.log(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
        }

        context.log('Error uploading blob:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
