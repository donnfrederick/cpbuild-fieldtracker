import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { ProjectRowInput } from '../interfaces/fieldTrackerInterfaces';

import { bulkRowCreateQueue } from '../queues';
import runWorker from '../workers/field-tracker-project-rows-bulk-create';
import { all } from "axios";

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

// Define Bulk transaction variables
const attempts = parseInt(process.env.JOB_ATTEMPTS || "5", 10);
const maxRows = parseInt(process.env.MAX_PROJECT_ROWS || "1500", 10);
const chunkSize = parseInt(process.env.CHUNK_SIZE || "100", 10);

const validTableNames = new Set(['field_tracker.projects', 'field_tracker.scope_types', 'field_tracker.scope_details', 'field_tracker.location_types', 'field_tracker.cost_types', 'dbo.users']);

function isValidTableName(tableName: string) {
    return validTableNames.has(tableName);
}

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (!isValidTableName(tableName)) {
        console.error(`Invalid table name: ${tableName}`);
        return false;
    }

    if (id <= 0) {
        return false; // Assuming IDs are positive integers
    }

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
    }
    return false;
};

async function saveNewTransaction(projectId: number, createdBy: number) {
    const transactionType = "bulk_row_create";
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
    context.log('HTTP trigger function processed a request to create one or more field tracker project rows.');

    if (context.bindingData.projectId && !await isValidId(context.bindingData.projectId, 'field_tracker.projects')) {
        context.res = {
            status: 400, // HTTP status code for bad request
            body: `Invalid Field Tracker Project ID: ${context.bindingData.projectId}`
        };
        return;
    }

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing."
        };
        return;
    }

    const projectRowDataArray = req.body.data as ProjectRowInput[];
    const projectId = context.bindingData.projectId;

    projectRowDataArray.forEach((row, index) => {
        const key = [
            row.building,
            row.level,
            row.area,
            row.scheme,
            row.unit,
            row.unitType,
            row.scopeDetailCodeId,
            row.locationTypeId,
            row.costTypeId,
            row.scopeTypeId
        ].join('|');
    });

    if (projectRowDataArray.length <= maxRows) {
            runWorker();

            const createdBy = projectRowDataArray[0].createdBy;
    
            const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
                const chunks: T[][] = [];
                for (let i = 0; i < array.length; i += chunkSize) {
                    chunks.push(array.slice(i, i + chunkSize));
                }
                return chunks;
            };
    
            try {
                const newTransactionId = await saveNewTransaction(projectId, createdBy);

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
                const chunkedDataArray = chunkArray(projectRowDataArray, chunkSize);
    
                const jobPromises = chunkedDataArray.map(chunk => 
                    bulkRowCreateQueue.add('field-tracker-project-rows-bulk-create', {
                        projectRowDataArray: chunk,
                        projectId
                    }, {
                        attempts: attempts,
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
                        processed_rows: projectRowDataArray.length,
                        processed_jobs: jobs.length,
                        message: "Bulk transaction request is being processed.",
                    },
                };
    
            } catch (error) {
                context.res = {
                    status: 500,
                    body: { error: 'Failed to add job to the queue' },
                };
    
                return;
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