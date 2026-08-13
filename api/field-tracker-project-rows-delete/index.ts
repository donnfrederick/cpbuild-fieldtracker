import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidTableName } from '../services/validationService';
import { ProjectRowDelete } from "../interfaces/fieldTrackerInterfaces";

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function isValidId(id: number, tableName: string, context: any): Promise<any> {
    context.log('isValidId called with id:', id, 'and tableName:', tableName);

    if (!isValidTableName(tableName, new Set(['field_tracker.projects', 'dbo.users']))) {
        console.error(`Invalid table name: ${tableName}`);
        return { isValid: false, debugInfo: `Invalid table name: ${tableName}` };
    }

    if (id <= 0) {
        return { isValid: false, debugInfo: 'ID is zero or negative' };
    }

    try {
        context.log('Attempting to initialize pool');
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        context.log('Pool initialized, executing query');

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);

        context.log('Query executed, result:', result.recordset[0].count);
        return { isValid: result.recordset[0].count > 0, debugInfo: `Queried ID: ${id}, Count: ${result.recordset[0].count}` };
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
        return { isValid: false, debugInfo: `Error: ${(error as Error).message}` };
    }
};

async function doesRowBelongToProject(rowId: number, projectId: number, context: any): Promise<boolean> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to delete field tracker project rows.');

    const requestBody = req.body;
    const projectId = context.bindingData.projectId;
    const { userId, rowIds } = requestBody.data;

    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        for (const rowId of rowIds) {
            if (!await isValidId(projectId, 'field_tracker.projects', context) || !await doesRowBelongToProject(rowId, projectId, context)) {
                await transaction.rollback();
                context.res = {
                    status: 400,
                    body: `Invalid project ID or Row ID ${rowId} does not belong to project ID ${projectId}.`
                };
                return;
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
        context.res = {
            status: 200,
            body: "Rows deleted successfully"
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        context.log('Error while deleting data:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
