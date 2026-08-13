import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { deleteBlob } from "../services/azureBlobStorageService";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getImageUploadData(uploadId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('uploadId', sql.Int, uploadId)
            .query(`SELECT file_url FROM field_tracker.image_uploads WHERE id = @uploadId`);
        return result.recordset[0];
    } catch (error) {
        console.error(`Error retrieving image_uploads entry:`, error);
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to delete blob.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    try {
        const uploadId = context.bindingData.uploadId;
        const imageUploadEntry = await getImageUploadData(uploadId);

        context.log("imageUploadEntry", imageUploadEntry);

        const containerName = process.env.BlobContainerName || "local-dev-images";

        const imgUrl = imageUploadEntry.file_url;
        const imgUrlArr = imgUrl.split(`/${containerName}/`);

        const deleteResult = await deleteBlob(imgUrlArr[imgUrlArr.length - 1], containerName);

        if (deleteResult.error == null) {
            const updateQuery = `UPDATE field_tracker.image_uploads
                SET upload_status_id = @statusId
                WHERE id = @uploadId
            `;

            await transaction.begin();
            const request = new sql.Request(transaction);

            await request
                .input('statusId', sql.Int, 4)
                .input('uploadId', sql.Int, uploadId)
                .input('deletedBy', sql.Int, req.body.deletedBy)
                .input('deletedAt', sql.DateTime, new Date())
                .query(updateQuery);

            await transaction.commit();

            context.res = {
                status: 200,
                body: {
                    message: `Successfully deleted blob properties and image_uploads entry`,
                    result: deleteResult.data
                }
            };
        } else {
            context.log(deleteResult.data);

            context.res = {
                status: 500,
                body: "Internal Server Error: " + deleteResult.message
            };
        }
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            context.log(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
        }

        context.log('Error deleting blob properties:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
