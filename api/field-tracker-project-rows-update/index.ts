import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { ProjectRowUpdate } from "../interfaces/fieldTrackerInterfaces";
import { isValidDate } from '../services/validationService';
import { projectRowUpdateColumnMap } from "../config/fieldTrackerColumnMapping";
import { buildUpdateQuery } from "../services/updateQueryBuilderService";

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const validTableNames = new Set([
  'field_tracker.projects',
  'field_tracker.scope_details',
  'field_tracker.location_types',
  'field_tracker.cost_types',
  'dbo.users',
  'field_tracker.scope_types'
]);

async function validateProjectRowUpdate(data: ProjectRowUpdate, projectId: number, context: Context): Promise<string | null> {
  // Validate rowId
  if (!data.rowId || typeof data.rowId !== "number") {
    return "Row ID is required and must be a number.";
  }

  // Validate changes
  const { changes } = data;

  if (changes.building && typeof changes.building !== "string") {
    return "Building must be a string.";
  }
  if (changes.level && typeof changes.level !== "string") {
    return "Level must be a string.";
  }
  if (changes.area && typeof changes.area !== "string") {
    return "Area must be a string.";
  }
  if (changes.shipPhase && typeof changes.shipPhase !== "string") {
    return "Ship Phase must be a string.";
  }
  if (changes.buildPhase && typeof changes.buildPhase !== "string") {
    return "Build Phase must be a string.";
  }
  if (changes.scheme && typeof changes.scheme !== "string") {
    return "Scheme must be a string.";
  }
  if (changes.unit && typeof changes.unit !== "string") {
    return "Unit must be a string.";
  }
  if (changes.unitType && typeof changes.unitType !== "string") {
    return "Unit Type must be a string.";
  }
  if (changes.scopeDetailCodeId && typeof changes.scopeDetailCodeId !== "number") {
    return "Scope Detail Code must be a number.";
  }
  if (changes.locationTypeId && typeof changes.locationTypeId !== "number") {
    return "Location Type ID must be a number.";
  }
  if (changes.costTypeId && typeof changes.costTypeId !== "number") {
    return "Cost Type ID must be a number.";
  }
  if (changes.quantity && typeof changes.quantity !== "number") {
    return "Quantity must be a number.";
  }
  if (changes.startingDate && !isValidDate(changes.startingDate)) {
    return "Starting Date must be a valid date string.";
  }
  if (changes.finishDate && !isValidDate(changes.finishDate)) {
    return "Finish Date must be a valid date string.";
  }
  if (changes.percentComplete && typeof changes.percentComplete !== "number") {
    return "Percent Complete must be a number.";
  }
  if (changes.actualManHours && typeof changes.actualManHours !== "number") {
    return "Actual Man Hours must be a number.";
  }
  if (changes.clearInspectionComplete && typeof changes.clearInspectionComplete !== "boolean") {
    return "Clear Inspection Complete must be a boolean.";
  }
  if (changes.clearInspectionPassed && typeof changes.clearInspectionPassed !== "boolean") {
    return "Clear Inspection Passed must be a boolean.";
  }
  if (changes.clearInspectionDate && !isValidDate(changes.clearInspectionDate)) {
    return "Clear Inspection Date must be a valid date string.";
  }
  if (changes.updatedAt && !isValidDate(changes.updatedAt)) {
    return "Updated At Date must be a valid date string.";
  }
  if (changes.updatedBy && typeof changes.updatedBy !== "number") {
    return "Updated By must be a number.";
  }
  if ('scopeTypeId' in changes && (changes.scopeTypeId === null || typeof changes.scopeTypeId !== "number")) {
    return "Scope Type is required and must be a number.";
  }
  if (changes.description && typeof changes.description !== "string") {
    return "Description must be a string.";
  }

  // Check for valid IDs and Table Names
  if (!await isValidId(data.rowId, 'field_tracker.project_rows', context)) {
    return "Invalid Field Tracker Project Row ID.";
  }
  if (changes.scopeDetailCodeId && !await isValidId(changes.scopeDetailCodeId, 'field_tracker.scope_details', context)) {
    return "Invalid scopeDetailCodeId.";
  }
  if (changes.locationTypeId && !await isValidId(changes.locationTypeId, 'field_tracker.location_types', context)) {
    return "Invalid locationTypeId.";
  }
  if (changes.costTypeId && !await isValidId(changes.costTypeId, 'field_tracker.cost_types', context)) {
    return "Invalid costTypeId.";
  }
  if (changes.updatedBy && !await isValidId(changes.updatedBy, 'dbo.users', context)) {
    return `Invalid user ID: ${changes.updatedBy}`;
  }
  if (changes.scopeTypeId && !await isValidId(changes.scopeTypeId, 'field_tracker.scope_types', context)) {
    return `Invalid scopeTypeId: ${changes.scopeTypeId}`;
  }

  // Make sure at least one field is being updated
  if (Object.keys(changes).length === 0) {
    return "At least one field must be provided for update.";
  }

  // All validation passed
  return null;
}

function isValidTableName(tableName: string) {
  return validTableNames.has(tableName);
}

async function isValidId(id: number, tableName: string, context: any): Promise<any> {
  if (!isValidTableName(tableName)) {
    console.error(`Invalid table name: ${tableName}`);
    return { isValid: false, debugInfo: `Invalid table name: ${tableName}` };
  }

  if (id <= 0) {
    return { isValid: false, debugInfo: 'ID is zero or negative' };
  }

  try {
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);

    return { isValid: result.recordset[0].count > 0, debugInfo: `Queried ID: ${id}, Count: ${result.recordset[0].count}` };
  } catch (error) {
    console.error(`Error checking valid ID in table ${tableName}:`, error);
    return { isValid: false, debugInfo: `Error: ${(error as Error).message}` };
  }
};

async function isLockedFromEditing(rowId: number): Promise<boolean> {
  if (rowId <= 0) {
    return false; // Assuming IDs are positive integers
  }

  try {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const result = await pool.request()
      .input('rowId', sql.Int, rowId)
      .query(`SELECT id FROM field_tracker.project_rows WHERE id = @rowId AND locked_from_editing = 1`);
    return result.recordset.length > 0;
  } catch (error) {
    console.error(`Error checking if locked from editing:`, error);
  }
  return false;
};

// Robust roles parser: handles CSV, JSON array, and stray wrapping quotes
function parseRoles(headerVal: unknown, _context: Context): string[] {
  const clean = (s: string) => s.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();

  if (Array.isArray(headerVal)) {
    return headerVal
      .flatMap(v => (typeof v === 'string' ? v.split(',') : []))
      .map(clean)
      .filter(Boolean);
  }

  if (typeof headerVal === 'string') {
    let s = headerVal.trim();

    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }

    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          return arr.map(x => clean(String(x))).filter(Boolean);
        }
      } catch {
        // fall through
      }
    }

    return s.split(',').map(clean).filter(Boolean);
  }

  return [];
}

// Normalize snake_case keys to camelCase for locked-field allowlist checks
function normalizeLockedChanges(changes: any) {
  const normalized: any = { ...changes };

  if ('starting_date' in normalized && !('startingDate' in normalized)) {
    normalized.startingDate = normalized.starting_date;
  }
  if ('finish_date' in normalized && !('finishDate' in normalized)) {
    normalized.finishDate = normalized.finish_date;
  }
  if ('percent_complete' in normalized && !('percentComplete' in normalized)) {
    normalized.percentComplete = normalized.percent_complete;
  }
  if ('clear_inspection_complete' in normalized && !('clearInspectionComplete' in normalized)) {
    normalized.clearInspectionComplete = normalized.clear_inspection_complete;
  }
  if ('clear_inspection_passed' in normalized && !('clearInspectionPassed' in normalized)) {
    normalized.clearInspectionPassed = normalized.clear_inspection_passed;
  }
  if ('clear_inspection_date' in normalized && !('clearInspectionDate' in normalized)) {
    normalized.clearInspectionDate = normalized.clear_inspection_date;
  }

  // Coerce common numeric/date string to number where appropriate
  if (typeof normalized.percentComplete === 'string' && normalized.percentComplete.trim() !== '') {
    const n = Number(normalized.percentComplete);
    if (!Number.isNaN(n)) normalized.percentComplete = n;
  }

  return normalized;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request to update one or more field tracker project rows.');
  const projectId = context.bindingData.projectId;
  const userRolesHeader = req.headers['x-user-roles'];

  const rolesArray = parseRoles(userRolesHeader, context);
  const isElevated = rolesArray.includes('controlsmanager') || rolesArray.includes('installmanager') || rolesArray.includes('admin');

  context.log('User Roles header:', userRolesHeader);
  context.log('Parsed rolesArray:', rolesArray, 'isElevated:', isElevated);

  // Fields allowed to be edited on locked rows (by elevated users only)
  const allowedWhileLocked = [
    'startingDate',
    'finishDate',
    'percentComplete',
    'clearInspectionComplete',
    'clearInspectionPassed',
    'clearInspectionDate',
    'updatedBy',
    'updatedAt'
  ];

  const validation = await isValidId(projectId, 'field_tracker.projects', context);
  context.log('validation.debugInfo is set to:', validation.debugInfo);
  if (!validation.isValid) {
    context.res = {
      status: 400,
      body: `Invalid Field Tracker Project ID: ${projectId}`
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

  const projectRowUpdates = req.body.data as ProjectRowUpdate[];
  let transaction: sql.Transaction | null = null;
  const pool = await initializePool(databaseIdentifier, sqlConfig);
  transaction = new sql.Transaction(pool);
  let updatedRows: Record<string, any>[] = [];

  try {
    await transaction.begin();

    let lockedError: number[] = [];

    for (const update of projectRowUpdates) {
      const validationError = await validateProjectRowUpdate(update, projectId, context);
      if (validationError) {
        await transaction.rollback();
        context.res = {
          status: 400,
          body: validationError
        };
        return;
      }

      const { rowId, changes } = update;
      const locked = await isLockedFromEditing(rowId);

      if (locked) {
        if (isElevated) {
          // Normalize then filter to allowlist
          const normalized = normalizeLockedChanges(changes);
          const filteredChanges: any = {};
          for (const key of Object.keys(normalized)) {
            if (allowedWhileLocked.includes(key)) {
              filteredChanges[key] = normalized[key];
            }
          }

          if (Object.keys(filteredChanges).length > 0) {
            const { query, parameters } = buildUpdateQuery(
              rowId,
              filteredChanges,
              'field_tracker.project_rows',
              projectRowUpdateColumnMap
            );

            const request = new sql.Request(transaction);
            for (const [param, value] of Object.entries(parameters)) {
              request.input(param, value);
            }

            const result = await request.query(query);
            if (result.recordset && result.recordset.length > 0) {
              updatedRows = updatedRows.concat(result.recordset);
            }
          } else {
            // No allowed fields present for elevated user on locked row
            lockedError.push(rowId);
          }
        } else {
          // Non-elevated users cannot edit locked rows at all
          lockedError.push(rowId);
        }
      } else {
        // Build and execute the UPDATE query normally
        const { query, parameters } = buildUpdateQuery(
          rowId,
          changes,
          'field_tracker.project_rows',
          projectRowUpdateColumnMap
        );

        const request = new sql.Request(transaction);
        for (const [param, value] of Object.entries(parameters)) {
          request.input(param, value);
        }

        const result = await request.query(query);
        if (result.recordset && result.recordset.length > 0) {
          updatedRows = updatedRows.concat(result.recordset);
        }
      }
    }

    if (lockedError.length > 0) {
      context.res = {
        status: 400,
        body: "The following rows are locked: " + lockedError.join(', '),
        updatedRows
      };
    } else {
      await transaction.commit();
      context.res = {
        status: 200,
        body: "All records updated successfully",
        updatedRows
      };
    }

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    context.log('Error while updating data:', error);

    let errorMsg = "Internal Server Error: " + (error as Error).message;

    if ((error as Error).message.includes('UQ_project_rows_filtered')) {
      errorMsg = "Cannot create duplicate rows";
    }

    context.res = {
      status: 500,
      body: errorMsg
    };
  }
};

export default httpTrigger;