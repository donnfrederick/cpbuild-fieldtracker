import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { buildInsertQuery } from "../services/insertQueryBuilderService";
import { initializePool } from '../services/dbService';
import { ScopeOverride } from '../interfaces/fieldTrackerInterfaces';
import { ScopeOverrideColumnMap } from '../config/fieldTrackerColumnMapping';
import { isValidId } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set(['field_tracker.projects', 'field_tracker.scope_details', 'dbo.users']);

async function validateScopeOverrideInput(data: ScopeOverride, context: Context): Promise<string | null> {
    if ((data.manHoursQuantityOverride === null || data.manHoursQuantityOverride === undefined) &&
        (data.installFactorOverride === null || data.installFactorOverride === undefined))
    {
        return "Either Man Hours Quantity Override or Install Factor Override is required. Both cannot be null or undefined.";
    }

    // Check for null or undefined and data types
    if (data.manHoursQuantityOverride && typeof data.manHoursQuantityOverride !== "number") {
        return "Man Hours Quantity Override must be a number.";
    }

    if (data.installFactorOverride && typeof data.installFactorOverride !== "number") {
        return "Install Factor Override must be a number.";
    }

    if (data.createdById && !await isValidId(data.createdById, 'dbo.users', validTableNames, context)) {
        return `Invalid user ID: ${data.createdById}`;
    }

    return null;
}

async function isScopeDetailUsedInProject(scopeDetailId: number, ftProjectId: number, pool: sql.ConnectionPool): Promise<boolean> {
    const request = new sql.Request(pool);
    request.input('scopeDetailId', sql.Int, scopeDetailId);
    request.input('ftProjectId', sql.Int, ftProjectId);

    const result = await request.query(`
        SELECT COUNT(1) AS count
        FROM field_tracker.project_rows
        WHERE scope_detail_code_id = @scopeDetailId
        AND field_tracker_project_id = @ftProjectId
    `);

    return result.recordset[0].count > 0;
}

async function doesScopeOverrideExist(scopeDetailId: number, ftProjectId: number, pool: sql.ConnectionPool): Promise<boolean> {
    const request = new sql.Request(pool);
    request.input('scopeDetailId', sql.Int, scopeDetailId);
    request.input('ftProjectId', sql.Int, ftProjectId);

    const result = await request.query(`
        SELECT COUNT(1) AS count
        FROM field_tracker.scope_overrides
        WHERE scope_details_id = @scopeDetailId
        AND field_tracker_project_id = @ftProjectId
    `);

    return result.recordset[0].count > 0;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create a new Field Tracker project scope_overrides entry.');
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const ftProjectId = context.bindingData.ftProjectId;
    const scopeDetailId = context.bindingData.scopeDetailId;
    const scopeDetailUsed = await isScopeDetailUsedInProject(scopeDetailId, ftProjectId, pool);
    const scopeOverrideExists = await doesScopeOverrideExist(scopeDetailId, ftProjectId, pool);
    const data = req.body.data as ScopeOverride[];

    if (ftProjectId && !await isValidId(ftProjectId, 'field_tracker.projects', validTableNames, context)) {
        context.res = {
            status: 400,
            body: `Invalid Field Tracker Project ID: ${ftProjectId}`
        };
        return;
    }

    if (scopeDetailId && !await isValidId(scopeDetailId, 'field_tracker.scope_details', validTableNames, context)) {
        context.res = {
            status: 400,
            body: `Invalid Scope Detail ID: ${scopeDetailId}`
        };
        return;
    }

    if (!scopeDetailUsed) {
        context.res = {
            status: 400,
            body: `Scope Detail ID "${scopeDetailId}" is not used in Field Tracker Project ID "${ftProjectId}".`
        };
        return;
    }

    if (scopeOverrideExists) {
        context.res = {
            status: 400,
            body: `Scope Override already exists for Field Tracker Project ID "${ftProjectId}" and Scope Detail ID "${scopeDetailId}". Try updating the existing entry instead.`
        };
        return;
    }

    if (!data) {
        context.res = {
            status: 400,
            body: "No request body provided."
        };
        return;
    }

    let transaction: sql.Transaction | null = null; // Declare transaction outside the try block so it can be accessed within the catch block
    transaction = new sql.Transaction(pool); // Initialize the transaction
    let insertedRows: Record<string, any>[] = [];

    try {
        await transaction.begin();

        for (const scopeOverrideInput of data) {
            scopeOverrideInput.ftProjectId = ftProjectId;
            scopeOverrideInput.scopeDetailId = scopeDetailId;

            const validationError = await validateScopeOverrideInput(scopeOverrideInput, context);
            if (validationError) {
                await transaction.rollback();
                context.res = {
                    status: 400,
                    body: validationError
                };
                return;
            }

            const tableName = "field_tracker.scope_overrides";
            const { query, parameters } = buildInsertQuery(scopeOverrideInput, tableName, ScopeOverrideColumnMap);

            const request = new sql.Request(transaction);
            for (const [param, value] of Object.entries(parameters)) {
                request.input(param, value);
            }

            const result = await request.query(query);
            if (result.recordset && result.recordset.length > 0) {
                insertedRows = insertedRows.concat(result.recordset); // Add the inserted rows to the array
            }
        }

        await transaction.commit();
        context.res = {
            status: 200,
            body: {
                data: insertedRows
            }
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        context.log('Error while inserting data:', error);

        try {
            const pool = await initializePool(databaseIdentifier, sqlConfig);
            const errorLogRequest = new sql.Request(pool);

            errorLogRequest.input('errorMessage', sql.NVarChar, (error as Error).message);
            errorLogRequest.input('stackTrace', sql.NVarChar, (error as Error).stack || 'No stack trace');

            await errorLogRequest.query(`
                INSERT INTO dbo.error_log (errorMessage, stackTrace)
                VALUES (@errorMessage, @stackTrace)
            `);
        } catch (logError) {
            context.log('Error logging to database:', logError);
        }

        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;