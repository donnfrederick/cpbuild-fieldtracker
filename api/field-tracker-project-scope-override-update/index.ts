import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidDate, isValidId } from "../services/validationService";
import { ScopeOverrideChanges } from "../interfaces/fieldTrackerInterfaces";
import { buildUpdateQuery } from "../services/updateQueryBuilderService";
import { scopeOverrideUpdateColumnMap } from "../config/fieldTrackerColumnMapping";

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set(['field_tracker.projects', 'dbo.users']);

async function validateScopeOverrideUpdate(data: ScopeOverrideChanges, scopeOverrideId: number, ftProjectId: number, context: Context): Promise<string | null> {
    if (!data.scopeOverrideId || typeof data.scopeOverrideId !== "number") {
        return "Scope Override ID is required and must be a number.";
    }

    // Validate changes
    const { changes } = data;

    // Check if at least one of the override fields is present in the changes object
    const hasAtLeastOneOverrideField = 'manHoursQuantityOverride' in changes || 'installFactorOverride' in changes;

    if (!hasAtLeastOneOverrideField) {
        return "At least one of the override fields (manHoursQuantityOverride or installFactorOverride) must be provided.";
    }

    // Validation for manHoursQuantityOverride, if it is present and not null
    if ('manHoursQuantityOverride' in changes && changes.manHoursQuantityOverride !== null && typeof changes.manHoursQuantityOverride !== "number") {
        return "Man Hours Quantity Override must be a number or null.";
    }

    // Validation for installFactorOverride, if it is present and not null
    if ('installFactorOverride' in changes && changes.installFactorOverride !== null && typeof changes.installFactorOverride !== "number") {
        return "Install Factor Override must be a number or null.";
    }
    if (changes.updatedAt && !isValidDate(changes.updatedAt)) {
        return "Updated At must be a valid date string.";
    }
    if (changes.updatedBy && typeof changes.updatedBy !== "number") {
        return "Updated By must be a number.";
    }

    // Check for valid IDs and Table Names
    if (!await isValidId(scopeOverrideId, 'field_tracker.scope_overrides', validTableNames, context)) {
        return `Invalid scopeOverrideId: ${scopeOverrideId}`;
    }
    if (changes.updatedBy && !await isValidId(changes.updatedBy, 'dbo.users', validTableNames, context)) {
        return `Invalid updatedBy: ${changes.updatedBy}`;
    }

    // Make suer at least one field is being updated
    if (!Object.keys(changes).length) {
        return "At least one scope override field must be updated.";
    }

    // Check if the scope override belongs to the project
    if (!await doesScopeOverrideBelongToProject(scopeOverrideId, ftProjectId, context)) {
        return `Scope Override ID: ${scopeOverrideId} does not belong to Field Tracker Project ID: ${ftProjectId}`;
    }

    return null;
}

async function doesScopeOverrideBelongToProject(scopeOverrideId: number, ftProjectId: number, context: Context): Promise<boolean> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeOverrideId', sql.Int, scopeOverrideId)
            .input('ftProjectId', sql.Int, ftProjectId)
            .query(`SELECT COUNT(1) AS count FROM field_tracker.scope_overrides WHERE id = @scopeOverrideId AND field_tracker_project_id = @ftProjectId`);

        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking row belonging in table field_tracker.project_rows:`, error);
        return false;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const ftProjectId = context.bindingData.ftProjectId;
    context.log(`HTTP trigger function processed a request to update field tracker project scope override value(s) for project ID: ${ftProjectId}.`);

    const validProject = await isValidId(ftProjectId, 'field_tracker.projects', validTableNames, context);

    if (!validProject.isValid) {
        context.res = {
            status: 400,
            body: `Invalid Field Tracker Project ID: ${ftProjectId}. ${validProject.debugInfo}`
        };
        return;
    }

    if (!req.body) {
        context.res = {
            status: 400,
            body: "No request body provided."
        };
        return;
    }

    const scopeOverrideUpdates = req.body.data as ScopeOverrideChanges[];
    let transaction: sql.Transaction | null = null;
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool);
    let updatedOverrides: Record<string, any>[] = [];

    try {
        await transaction.begin();

        for (const update of scopeOverrideUpdates) {
            const validationError = await validateScopeOverrideUpdate(update, update.scopeOverrideId, ftProjectId, context);
            if (validationError) {
                context.res = {
                    status: 400,
                    body: validationError
                };
                return;
            }

            const { scopeOverrideId, changes } = update;

            const { query, parameters } = buildUpdateQuery(scopeOverrideId, changes, 'field_tracker.scope_overrides', scopeOverrideUpdateColumnMap);

            const request = new sql.Request(transaction);
            for (const [param, value] of Object.entries(parameters)) {
                request.input(param, value);
            }

            const result = await request.query(query);
            if (result.recordset && result.recordset.length > 0) {
                updatedOverrides = updatedOverrides.concat(result.recordset); // Add the updated row to the array
            }
        }

        await transaction.commit();
        context.res = {
            status: 200,
            body: 'All records updated successfully',  updatedOverrides
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        context.log('Error while updating Scope Overrides data:', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
