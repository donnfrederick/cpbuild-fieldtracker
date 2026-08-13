import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { bulkRowCreateQueue, bulkRowDeleteQueue } from '../queues';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getTransactionDetails(transactionId: number) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('transactionId', sql.Int, transactionId)
            .query(`SELECT job_id FROM field_tracker.bulk_transaction_jobs WHERE transaction_id = @transactionId`);
        return result.recordset;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch job status.');

    const type = req.query.type;
    const transactionId = context.bindingData.transactionId;

    if (!transactionId || transactionId < 1) {
        context.res = {
            status: 404,
            body: { error: 'No transaction_id provided.' },
        };
        return;
    }

    try {
        const jobs = await getTransactionDetails(transactionId);

        if (jobs) {
            // Fetch the status of each job concurrently
            const jobPromises = jobs.map(async (job) => {
                const jobId = job.job_id;
                const jobData = type == "bulk_row_create" ? await bulkRowCreateQueue.getJob(jobId) : await bulkRowDeleteQueue.getJob(jobId);
                if (jobData) {
                    const jobState = await jobData.getState(); // Get the state of the job
                    return {
                        jobId,
                        status: jobState,
                        jobData
                    };
                } else {
                    return { jobId, error: 'Job not found' };
                }
            });

            // Resolve all job statuses
            const jobStatuses = await Promise.all(jobPromises);

            // Return the statuses
            context.res = {
                status: 200,
                body: {
                    transactionId,
                    jobStatuses
                }
            };
        } else {
            context.res = {
                status: 404,
                body: { error: 'Transaction not found.' },
            };
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: 'An error occurred while fetching job statuses.' },
        };
    }

};

export default httpTrigger;
