import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidTableName } from '../services/validationService';

import { Worker } from 'bullmq';
import { connection } from '../redis-config';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function isValidId(id: number, tableName: string, pool: any): Promise<any> {
    console.log('isValidId called with id:', id, 'and tableName:', tableName);

    if (!isValidTableName(tableName, new Set(['field_tracker.projects', 'dbo.users']))) {
        console.error(`Invalid table name: ${tableName}`);
        return { isValid: false, debugInfo: `Invalid table name: ${tableName}` };
    }

    if (id <= 0) {
        return { isValid: false, debugInfo: 'ID is zero or negative' };
    }

    try {
        console.log('Attempting to initialize pool');
        console.log('Pool initialized, executing query');

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);

        console.log('Query executed, result:', result.recordset[0].count);
        return { isValid: result.recordset[0].count > 0, debugInfo: `Queried ID: ${id}, Count: ${result.recordset[0].count}` };
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
        return { isValid: false, debugInfo: `Error: ${(error as Error).message}` };
    }
};

async function doesRowBelongToProject(rowId: number, projectId: number, pool: any): Promise<boolean> {
    try {
        const result = await pool.request()
            .input('rowId', sql.Int, rowId)
            .input('projectId', sql.Int, projectId)
            .query(`SELECT COUNT(1) AS count FROM field_tracker.project_rows WHERE id = @rowId AND field_tracker_project_id = @projectId`);

        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking row belonging in table field_tracker.project_rows:`, error);
        return false;
    }
}

async function updateTransactionJob(jobId: any, jobStatus: string) {
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.bulk_transaction_jobs
        SET status = @jobStatus
        WHERE job_id = @jobId
    `;

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        await request
            .input('jobId', sql.Int, jobId)
            .input('jobStatus', sql.NVarChar(255), jobStatus)
            .query(updateQuery);

        await transaction.commit();
    } catch (error) {
        console.error(error);
    } 
}

async function runWorker() {
    const worker = new Worker('bulkRowDeleteQueue', async (job: any) => {
        const { rowIds, userId, projectId } = job.data;

        let transaction: sql.Transaction | null = null;
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            for (const rowId of rowIds) {
                if (!await isValidId(projectId, 'field_tracker.projects', pool) || !await doesRowBelongToProject(rowId, projectId, pool)) {
                    await transaction.rollback();

                    throw new Error(`Invalid project ID or Row ID ${rowId} does not belong to project ID ${projectId}.`);
                }

                const request = new sql.Request(transaction);
                await request.input('rowId', sql.Int, rowId)
                    .input('deletedBy', sql.Int, userId)
                    .query(`
                        UPDATE field_tracker.project_rows
                        SET deleted_at = GETDATE(), deleted_by = @deletedBy
                        WHERE id = @rowId
                    `);
            }

            await transaction.commit();

            await updateTransactionJob(job.id, "completed");
        } catch (error) {
            await updateTransactionJob(job.id, "failed");
            if (transaction) {
                await transaction.rollback();
            }
            
            throw new Error(`Job failed: ${error}`);
        }
    }, { connection });
}

export default runWorker;