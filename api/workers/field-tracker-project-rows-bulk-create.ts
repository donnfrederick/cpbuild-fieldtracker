import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { buildInsertQuery } from "../services/insertQueryBuilderService";
import { initializePool } from '../services/dbService';
import { ProjectRowInput } from '../interfaces/fieldTrackerInterfaces';
import { projectRowInputColumnMap } from '../config/fieldTrackerColumnMapping';
import { isValidDate } from '../services/validationService';

import { Worker, UnrecoverableError } from 'bullmq';
import { connection } from '../redis-config';

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
    const worker = new Worker('bulkRowCreateQueue', async (job: any) => {
        const { projectRowDataArray, projectId } = job.data;

        let transaction: sql.Transaction | null = null;
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            for (const projectRowData of projectRowDataArray) {
                projectRowData.projectId = projectId;

                const validationError = await validateProjectRowInput(projectRowData);
                if (validationError) {
                    await transaction.rollback();
                    
                    throw new Error(JSON.stringify(validationError));
                }

                const tableName = "field_tracker.project_rows";
                const { query, parameters } = buildInsertQuery(projectRowData, tableName, projectRowInputColumnMap);

                const request = new sql.Request(transaction);
                for (const [param, value] of Object.entries(parameters)) {
                    request.input(param, value);
                }

                await request.query(query);
            }

            await transaction.commit();

            await updateTransactionJob(job.id, "completed");
        } catch (error: any) {
            await updateTransactionJob(job.id, "failed");

            if (transaction) {
                await transaction.rollback();
            }

            if(error.message.includes('unique index')){
                throw new UnrecoverableError('Job failed: Duplicate key found. Check your input for duplicates.');
            }
            
            throw new Error(error.message);
        }
    }, { connection });
}

export default runWorker;