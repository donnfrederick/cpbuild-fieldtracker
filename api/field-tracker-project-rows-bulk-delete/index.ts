import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

import { bulkRowDeleteQueue } from '../queues';
import runWorker from '../workers/field-tracker-project-rows-bulk-delete';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function saveNewTransaction(projectId: number, createdBy: number) {
    const transactionType = "bulk_row_delete";
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.bulk_transactions (field_tracker_project_id, transaction_type, created_by)
        OUTPUT INSERTED.id
        VALUES (@projectId, @transactionType, @createdBy);
    `;

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        const insertResult = await request
            .input('projectId', sql.Int, projectId)
            .input('transactionType', sql.NVarChar(255), transactionType)
            .input('createdBy', sql.Int, createdBy)
            .query(insertQuery);

        if (insertResult.recordset.length === 0) {
            return false;
        }

        const newTransactionId = insertResult.recordset[0].id;
        await transaction.commit();

        return newTransactionId;
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function updateProjectTransactionId(projectId: number, bulkTransactionId: number) {
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.projects
        SET bulk_transaction_id = @bulkTransactionId
        WHERE id = @projectId
    `;

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        await request
            .input('projectId', sql.Int, projectId)
            .input('bulkTransactionId', sql.Int, bulkTransactionId)
            .query(updateQuery);

        await transaction.commit();
    } catch (error) {
        console.error(error);
    }   
}

async function saveNewTransactionJob(transactionId: number, jobId: number) {
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.bulk_transaction_jobs (job_id, transaction_id, status)
        VALUES (@jobId, @transactionId, @status);
    `;

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        const insertResult = await request
            .input('jobId', sql.Int, jobId)
            .input('transactionId', sql.Int, transactionId)
            .input('status', sql.NVarChar(255), "pending")
            .query(insertQuery);

        await transaction.commit();
    } catch (error) {
        console.error(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to delete field tracker project rows.');

    const requestBody = req.body;
    const projectId = context.bindingData.projectId;
    const { userId, rowIds } = requestBody.data;

    if (rowIds.length <= 1500) {
        runWorker();

        const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
            const chunks: T[][] = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                chunks.push(array.slice(i, i + chunkSize));
            }
            return chunks;
        };
    
        try {
            const newTransactionId = await saveNewTransaction(projectId, userId);

            if (!newTransactionId) {
                context.res = {
                    status: 500,
                    body: {
                        error: "Unable to create transaction",
                    }
                };
                
                return;
            }

            await updateProjectTransactionId(projectId, newTransactionId);
            const chunkedDataArray = chunkArray(rowIds, 100);
    
            const jobPromises = chunkedDataArray.map(chunk => 
                bulkRowDeleteQueue.add('field-tracker-project-rows-bulk-delete', {
                    rowIds: chunk, userId, projectId
                }, {
                    attempts: 5,
                    backoff: {
                        type: 'fixed',
                        delay: 3000
                    }
                })
            );
    
            const jobs = await Promise.all(jobPromises);
            const jobIds = jobs
                .map(job => job?.id)
                .filter(id => id !== undefined)
                .map(id => parseInt(id as string, 10));

            jobIds.forEach(async (jobId) => {
                await saveNewTransactionJob(newTransactionId, jobId);
            });
    
            context.res = {
                status: 200,
                body: {
                    transactionId: newTransactionId,
                    status: "queued",
                    processed_rows: rowIds.length,
                    processed_jobs: jobs.length,
                    message: "Bulk transaction request is being processed.",
                },
            };
        } catch (error) {
            context.log('Error while deleting data:', error);
            context.res = {
                status: 500,
                body: "Internal Server Error: " + (error as Error).message
            };
        }
    } else {
        context.res = {
            status: 400,
            body: { error: 'Maximum of 1500 rows per request' },
        };

        return;
    }
};

export default httpTrigger;
