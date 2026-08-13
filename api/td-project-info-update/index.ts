import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidId } from '../services/validationService';
import { ProjectInfoUpdate } from '../interfaces/toolsDashboardInterfaces';
import { buildUpdateQuery } from "../services/updateQueryBuilderService";
import { projectInfoUpdateColumnMap } from "../config/toolsDashboardColumnMapping";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set(['dbo.projects']);

async function validateProjectInfoUpdate(data: ProjectInfoUpdate, projectId: number, context: Context): Promise<string | null> {
    const { changes } = data;

    if (changes.projectName && typeof changes.projectName !== 'string') {
        return await logAndReturnError("projectName must be a string.", context);
    }
    if (changes.projectStatusId && typeof changes.projectStatusId !== 'number') {
        return await logAndReturnError("projectStatusId must be a number.", context);
    }
    if(changes.projectManagerId && typeof changes.projectManagerId !== 'number') {
        return await logAndReturnError("projectManagerId must be a number.", context);
    }
    if(changes.installManagerId && typeof changes.installManagerId !== 'number') {
        return await logAndReturnError("installManagerId must be a number.", context);
    }
    if(changes.stateId && typeof changes.stateId !== 'number') {
        return await logAndReturnError("stateId must be a number.", context);
    }
    if(changes.salesforceId && typeof changes.salesforceId !== 'string') {
        return await logAndReturnError("salesforceId must be a string.", context);
    }
    if (changes.updatedBy && typeof changes.updatedBy !== "number") {
        return await logAndReturnError("Updated By must be a number.", context);
    }

    // Check for valid IDs and Table Names
    if(!await isValidId(projectId, 'dbo.projects', validTableNames, context)) {
        return await logAndReturnError(`Invalid project ID: ${projectId}`, context);
    }
    if(changes.projectStatusId && !await isValidId(changes.projectStatusId, 'dbo.project_status_types', validTableNames, context)) {
        return await logAndReturnError(`Invalid projectStatusId: ${changes.projectStatusId}`, context);
    }
    if(changes.projectManagerId && !await isValidId(changes.projectManagerId, 'dbo.users', validTableNames, context)) {
        return await logAndReturnError(`Invalid projectManagerId: ${changes.projectManagerId}`, context);
    }
    if(changes.installManagerId && !await isValidId(changes.installManagerId, 'dbo.users', validTableNames, context)) {
        return await logAndReturnError(`Invalid installManagerId: ${changes.installManagerId}`, context);
    }
    if(changes.stateId && !await isValidId(changes.stateId, 'dbo.states', validTableNames, context)) {
        return await logAndReturnError(`Invalid stateId: ${changes.stateId}`, context);
    }
    if(changes.updatedBy && !await isValidId(changes.updatedBy, 'dbo.users', validTableNames, context)) {
        return await logAndReturnError(`Invalid updatedBy: ${changes.updatedBy}`, context);
    }

    // Make sure at least one field is being updated
    if (Object.keys(changes).length === 0) {
        return await logAndReturnError("At least one field must be provided for update.", context);
    }

    return null;
}

async function logErrorToDb(errorMessage: string, context: Context | null = null) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    if (pool && pool.connected) {
        try {
            await pool.request()
                .input('errorMessage', sql.NVarChar, errorMessage)
                .input('errorTime', sql.DateTime, new Date())
                .query(`INSERT INTO dbo.error_log (error_message, error_time) VALUES (@errorMessage, @errorTime)`);
            if (context) {
                context.log('Error logged successfully to error_log.');
            }
        } catch (loggingError) {
            if (context) {
                context.log(`Failed to log error to error_log: ${(loggingError as Error).message}`);
            }
        }
    }
}

async function logAndReturnError(errorMessage: string, context: Context | null = null) {
    await logErrorToDb(errorMessage, context);
    return errorMessage;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to update root project info.');
    const projectId = context.bindingData.projectId;

    const validProject = await isValidId(projectId, 'dbo.projects', validTableNames, context);
    context.log('validation.debugInfo is set to:', validProject.debugInfo);

    if (!validProject.isValid) {
        context.res = {
            status: 400,
            body: `Invalid Tools Dashboard root Project ID: ${projectId}`
        };
        return;
    }

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const projectInfoUpdates = req.body.data as ProjectInfoUpdate[];
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);
    let updatedProject: Record<string, any>[] = [];

    try {
        await transaction.begin();

        for (const update of projectInfoUpdates) {
            const validationError = await validateProjectInfoUpdate(update, projectId, context);
            if (validationError) {
                await transaction.rollback();
                context.res = {
                    status: 400,
                    body: validationError
                };
                return;
            }

            const { changes } = update;

            // Build and execute the UPDATE query
            const { query, parameters } = buildUpdateQuery(projectId, changes, 'dbo.projects', projectInfoUpdateColumnMap);

            const request = new sql.Request(transaction);
            for (const [param, value] of Object.entries(parameters)) {
                request.input(param, value);
            }

            const result = await request.query(query);
            if (result.recordset && result.recordset.length > 0) {
                updatedProject = result.recordset;
            }
        }

        await transaction.commit();
        context.res = {
            status: 200,
            body: "Project info updated successfully.",
            updatedProject
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        context.log('Error while updating project info:', error);

        // Attempt to log the error to the error_log table
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        if (pool && pool.connected) {
            try {
                await pool.request()
                    .input('errorMessage', sql.NVarChar, `Error updating project: ${(error as Error).message}`)
                    .input('errorTime', sql.DateTime, new Date())
                    .query(`INSERT INTO dbo.error_log (error_message, error_time) VALUES (@errorMessage, @errorTime)`);
                context.log('Error logged successfully to error_log.');
            } catch (loggingError) {
                context.log(`Failed to log error to error_log: ${(loggingError as Error).message}`);
            }
        }

        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;