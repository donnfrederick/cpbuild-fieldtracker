import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { buildInsertQuery } from "../services/insertQueryBuilderService";
import { initializePool } from '../services/dbService';
import { ProjectRowInput } from '../interfaces/fieldTrackerInterfaces';
import { projectRowInputColumnMap } from '../config/fieldTrackerColumnMapping';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set(['field_tracker.projects', 'field_tracker.scope_types', 'field_tracker.scope_details', 'field_tracker.location_types', 'field_tracker.cost_types', 'dbo.users']);

// TODO: Input validation within each endpoint function file is repetitive. Consider moving validation to a separate service while implementing an upcoming endpoint.
async function validateProjectRowInput(data: ProjectRowInput): Promise<string | null> {
    // Check for null or undefined and data types
    if (data.building === null || data.building === undefined || typeof data.building !== "string") {
        return "Building is required and must be a string.";
    }

    if (data.level === null || data.level === undefined || typeof data.level !== "string") {
        return "Level is required and must be a string.";
    }

    if (data.area === null || data.area === undefined || typeof data.area !== "string") {
        return "Area is required and must be a string.";
    }

    if (data.shipPhase === null || data.shipPhase === undefined || typeof data.shipPhase !== "string") {
        return "Ship Phase is required and must be a string.";
    }

    if (data.buildPhase === null || data.buildPhase === undefined || typeof data.buildPhase !== "string") {
        return "Build Phase is required and must be a string.";
    }

    if (data.scheme === null || data.scheme === undefined || typeof data.scheme !== "string") {
        return "Scheme is required and must be a string.";
    }

    if (data.unit === null || data.unit === undefined || typeof data.unit !== "string") {
        return "Unit is required and must be a string.";
    }

    if (data.unitType === null || data.unitType === undefined || typeof data.unitType !== "string") {
        return "Unit Type is required and must be a string.";
    }

    if (data.scopeTypeId === null || data.scopeTypeId === undefined || typeof data.scopeTypeId !== "number") {
        return "Scope Type is required and must be a number.";
    }

    if (data.scopeDetailCodeId === null || data.scopeDetailCodeId === undefined || typeof data.scopeDetailCodeId !== "number") {
        return "Scope Detail Code is required and must be a number.";
    }

    if (data.locationTypeId === null || data.locationTypeId === undefined || typeof data.locationTypeId !== "number") {
        return "Location Type ID is required and must be a number.";
    }

    if (data.costTypeId === null || data.costTypeId === undefined || typeof data.costTypeId !== "number") {
        return "Cost Type ID is required and must be a number.";
    }

    if (data.quantity === null || data.quantity === undefined || typeof data.quantity !== "number") {
        return "Quantity is required and must be a number.";
    }

    if (data.startingDate && !isValidDate(data.startingDate)) {
        return "Starting Date must be a valid date.";
    }

    if (data.finishDate && !isValidDate(data.finishDate)) {
        return "Finish Date must be a valid date.";
    }

    if (data.percentComplete && typeof data.percentComplete !== "number") {
        return "Percent Complete must be a number.";
    }

    if (data.actualManHours && typeof data.actualManHours !== "number") {
        return "Actual Man Hours must be a number.";
    }

    if (data.clearInspectionComplete !== undefined) { // Check if the property is defined
        if (typeof data.clearInspectionComplete !== "boolean" && data.clearInspectionComplete !== null) {
            return "Clear Inspection Complete must be true, false, or null.";
        }
    }

    if (data.clearInspectionPassed !== undefined) { // Check if the property is defined
        if (data.clearInspectionPassed !== null && typeof data.clearInspectionPassed !== "boolean") {
            return "Clear Inspection Passed must be true, false, or null (for pending).";
        }
    }

    if (data.clearInspectionDate && !isValidDate(data.clearInspectionDate)) {
        return "Clear Inspection Date must be a valid date.";
    }

    // Check for valid IDs and Table Names
    const validScopeType = await isValidId(data.scopeTypeId, 'field_tracker.scope_types');
    if (!validScopeType) {
        return "Invalid scopeTypeId.";
    }

    const validScopeDetails = await isValidId(data.scopeDetailCodeId, 'field_tracker.scope_details');
    if (!validScopeDetails) {
        return "Invalid scopeDetailCodeId.";
    }

    const validLocationType = await isValidId(data.locationTypeId, 'field_tracker.location_types');
    if (!validLocationType) {
        return "Invalid locationTypeId.";
    }

    const validCostType = await isValidId(data.costTypeId, 'field_tracker.cost_types');
    if (!validCostType) {
        return "Invalid costTypeId.";
    }

    if (data.createdBy && !await isValidId(data.createdBy, 'dbo.users')) {
        return `Invalid user ID: ${data.createdBy}`;
    }

    // All validation passed
    return null;
}

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
        // Error caught and logged, proceed to return false
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

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

    let transaction: sql.Transaction | null = null; // Declare transaction outside the try block so it can be accessed within the catch block
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    transaction = new sql.Transaction(pool); // Initialize the transaction
    let insertedRows: Record<string, any>[] = [];

    try {
        await transaction.begin();

        for (const projectRowData of projectRowDataArray) {
            projectRowData.projectId = projectId; // Add projectId to each project row

            const validationError = await validateProjectRowInput(projectRowData);
            if (validationError) {
                await transaction.rollback();
                context.res = {
                    status: 400,
                    body: validationError
                };
                return;
            }

            const tableName = "field_tracker.project_rows";
            const { query, parameters } = buildInsertQuery(projectRowData, tableName, projectRowInputColumnMap);

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
                message: "All records inserted successfully",
                insertedRows
            }
        };
    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        context.log('Error while inserting data:', error);

        // Log the error to the dbo.error_log table
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