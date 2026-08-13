import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from "mssql";
import { baseConfig } from "../dbConfig";
import { initializePool } from "../services/dbService";
import { BlockedUnitByScope, BlockedUnitsResult, BlockingIssues, RequestResult } from "./interface";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

// Validate if ID exists in the specified table
async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (!id || id <= 0) return false;
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0]?.count > 0;
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
        return false;
    }
}

// Get all blocked units by scope
async function getBlockedUnitsByScope(projectByScopeId: number): Promise<RequestResult<BlockedUnitByScope[]>> {
    if (!projectByScopeId || projectByScopeId <= 0) {
        return { data: [], statusCode: 400, error: new Error("Invalid projectByScopeId") };
    }
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const query = `
            SELECT ubs.project_by_scope_id AS projectScopeById,
                   ubs.id AS unitByScopeId,
                   pr.building, 
                   pr.building_level AS level, 
                   pr.unit, 
                   pr.area,
                   pr.unit_type AS unitType, 
                   ubsst.status_name AS unitStatusName,
                   upbs.initial_cumulative_percent AS progress
            FROM field_tracker.units_by_scope ubs
            JOIN field_tracker.project_rows pr ON pr.id = ubs.unit_id
            JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id
            JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id
            WHERE ubs.status_id = 7 AND ubs.project_by_scope_id = @projectByScopeId`;

        const result = await pool.request()
            .input("projectByScopeId", sql.Int, projectByScopeId)
            .query(query);

        return { data: result.recordset, statusCode: 200, error: null };
    } catch (error) {
        console.error("Error fetching blocked units by scope:", (error as Error).message);
        return { data: [], statusCode: 500, error: error as Error };
    }
}

// Get blocking issues for a unit
async function getBlockingIssues(unitByScopeId: number, workerId: number): Promise<RequestResult<BlockingIssues[]>> {
    if (!unitByScopeId || unitByScopeId <= 0) {
        return { data: [], statusCode: 400, error: new Error("Invalid unitByScopeId") };
    }
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const query = `
            SELECT 
                bi.id AS blockingIssueId, 
                bi.unit_id AS unitId, 
                bi.task_id AS taskId,
                upbs.phase_name AS unitPhaseName, 
                ubsst.status_name AS unitStatusName,
                upbs.initial_cumulative_percent AS progress
            FROM field_tracker.blocking_issues bi
            JOIN field_tracker.units_by_scope ubs ON ubs.id = bi.unit_id
            JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id
            JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id
            JOIN field_tracker.unit_tasks ut ON bi.task_id = ut.id
            WHERE ubs.id = @unitByScopeId
            AND ut.assigned_worker_id = @workerId`;
        
        const result = await pool.request()
            .input("unitByScopeId", sql.Int, unitByScopeId)
            .input("workerId", sql.Int, workerId)
            .query(query);

        return { data: result.recordset, statusCode: 200, error: null };
    } catch (error) {
        console.error("Error fetching blocking issues:", (error as Error).message);
        return { data: [], statusCode: 500, error: error as Error };
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request to list all blocked units by scope and worker.");

    const { workerId, projectByScopeId } = context.bindingData;

    if (!workerId || !projectByScopeId) {
        context.res = { status: 400, body: "workerId and projectByScopeId are required." };
        return;
    }

    if (!await isValidId(workerId, "field_tracker.workers")) {
        context.res = { status: 400, body: "Invalid workerId." };
        return;
    }

    const blockedUnitsByScope = await getBlockedUnitsByScope(projectByScopeId);
    if (blockedUnitsByScope.error) {
        context.res = { status: 500, body: `Error: ${blockedUnitsByScope.error.message}` };
        return;
    }

    try {
        const results = await Promise.all(
            blockedUnitsByScope.data.map(async (item) => {
                const blockingIssues = await getBlockingIssues(item.unitId, workerId);
                if (blockingIssues.error) {
                    return { blockedUnitByScope: item, blockingIssues: [], error: blockingIssues.error.message } as BlockedUnitsResult;
                }
                return { blockedUnitByScope: item, blockingIssues: blockingIssues.data } as BlockedUnitsResult;
            })
        ) as BlockedUnitsResult[];

        context.res = { body: results };
    } catch (error) {
        context.res = { status: 500, body: `Unexpected error: ${(error as Error).message}` };
    }
};

export default httpTrigger;
