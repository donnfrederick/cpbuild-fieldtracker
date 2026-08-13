import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { RequestResult } from "../interfaces/requestResult";
import { CompletedInspection, MainTaskDetail, ProjectByScopeDetail, UnitTask } from "../interfaces/inspectionTracker/completedInspections";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

// Get all units by scope
async function getProjectByScope(projectByScopeId: number): Promise<RequestResult<ProjectByScopeDetail>> {
    if (!projectByScopeId || projectByScopeId <= 0) {
        return { data: {} as ProjectByScopeDetail, statusCode: 400, error: new Error("Invalid projectByScopeId") };
    }
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const query = `
            SELECT 
                pbs.id as projectScopeById,
                project.project_name as projectName,
                st.scope_name as scopeName
            FROM field_tracker.projects_by_scope pbs
            JOIN dbo.projects project ON project.id = pbs.project_id
            JOIN field_tracker.scope_types st ON st.id = pbs.scope_type_id
            WHERE pbs.id = @projectByScopeId`;

        const result = await pool.request()
            .input("projectByScopeId", sql.Int, projectByScopeId)
            .query(query);

        return { data: result.recordset[0], statusCode: 200, error: null };
    } catch (error) {
        console.error("Error fetching project by scope:", (error as Error).message);
        return { data: {} as ProjectByScopeDetail, statusCode: 500, error: error as Error };
    }
}

// Get all main tasks
async function getUnitsByScope(projectByScopeId: number[]): Promise<RequestResult<MainTaskDetail[]>> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const query = `
            WITH TopLevelMainTasks AS (
                SELECT *
                FROM field_tracker.unit_tasks ut
                WHERE ut.parent_task_id IS NULL
                AND ut.task_type_id = 1
                AND ut.status_id IN (5, 6)
                AND ut.phase_id = (
                    SELECT TOP 1 id
                    FROM field_tracker.unit_phases_by_scope
                    WHERE 
                        id = ut.phase_id
                    AND phase_name IN ('Clear Inspection', 'Complete')
                )
            )

            SELECT 
                ubs.project_by_scope_id AS projectScopeById,
                pr.building, 
                pr.building_level AS level, 
                pr.unit, 
                pr.area,
                pr.unit_type AS unitType,
                ubs.id AS unitByScopeId, 
                upbs.id AS unitPhaseId, 
                upbs.phase_name AS unitPhaseName, 
                ubsst.status_name AS unitStatusName,
                upbs.initial_cumulative_percent AS progress,
                ut.id AS taskId,
                tt.type_name AS taskTypeName,
                tst.status_name AS taskStatusName,
                ut.created_at AS dateCreated,
                ut.scheduled_date as scheduledDate,
                u.name AS createdBy,
                ut.reviewed_at AS inspectionDate,
                inspector.name AS inspectedBy
            FROM field_tracker.units_by_scope ubs
            JOIN field_tracker.project_rows pr 
                ON pr.id = ubs.unit_id
            JOIN field_tracker.unit_phases_by_scope upbs 
                ON ubs.current_phase_id = upbs.id
            JOIN field_tracker.unit_by_scope_status_types ubsst 
                ON ubs.status_id = ubsst.id
            JOIN TopLevelMainTasks ut 
                ON ut.unit_by_scope_id = ubs.id
            JOIN field_tracker.task_types tt
                ON ut.task_type_id = tt.id
            JOIN field_tracker.task_status_types tst
                ON ut.status_id = tst.id
            LEFT JOIN dbo.users u
                ON ut.created_by = u.id
            LEFT JOIN dbo.users inspector
                ON ut.reviewed_by = inspector.id
            WHERE 
                upbs.phase_name IN ('Clear Inspection', 'Complete')
            AND ubs.status_id != 7
            AND ubs.project_by_scope_id = @projectByScopeId
`;

        const result = await pool.request()
            .input("projectByScopeId", sql.Int, projectByScopeId)
            .query(query);

        return { data: result.recordset, statusCode: 200, error: null };
    } catch (error) {
        console.error("Error fetching main tasks:", (error as Error).message);
        return { data: [], statusCode: 500, error: error as Error };
    }
}

// Get all resolution tasks
async function getResolutionTasks(unitByScopeId: number): Promise<RequestResult<UnitTask[]>> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const query = `
            SELECT 
                ubs.id as unitByScopeId,
                ut.id as taskId,
                tt.type_name as taskTypeName,
                tst.status_name as taskStatusName,
                ut.created_at as dateCreated,
                ut.scheduled_date as scheduledDate,
                u.name as createdBy,
                ut.parent_task_id AS parentTaskId,
                ptt.type_name AS parentTaskTypeName,
                pst.status_name AS parentTaskStatusName
            FROM field_tracker.unit_tasks ut
            JOIN field_tracker.units_by_scope ubs
                ON ut.unit_by_scope_id = ubs.id
            JOIN field_tracker.task_types tt
                ON ut.task_type_id = tt.id
            JOIN field_tracker.task_status_types tst
                ON ut.status_id = tst.id
            LEFT JOIN dbo.users u
                ON ut.created_by = u.id
            LEFT JOIN field_tracker.unit_tasks parent_ut
            ON ut.parent_task_id = parent_ut.id
            LEFT JOIN field_tracker.task_types ptt
                ON parent_ut.task_type_id = ptt.id
            LEFT JOIN field_tracker.task_status_types pst
                ON parent_ut.status_id = pst.id
            WHERE 
                ubs.id = @unitByScopeId
            AND ut.task_type_id = 4
            AND ut.status_id in (5, 6)
            AND parent_ut.phase_id = (
                SELECT TOP 1 id
                FROM field_tracker.unit_phases_by_scope
                WHERE 
                    id = ut.phase_id 
                AND phase_name = 'Clear Inspection'
            )`;

        const result = await pool.request()
            .input("unitByScopeId", sql.Int, unitByScopeId)
            .query(query);

        return { data: result.recordset, statusCode: 200, error: null };
    } catch (error) {
        console.error("Error fetching resoltuion tasks:", (error as Error).message);
        return { data: [], statusCode: 500, error: error as Error };
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request to list all completed inspections.");

    const { projectByScopeId } = context.bindingData;

    if (!projectByScopeId) {
        context.res = { status: 400, body: "projectByScopeId is required." };
        return;
    }


    try {
        const projectDetail = await getProjectByScope(projectByScopeId);
        if (projectDetail.error) {
            context.res = { status: 500, body: `Error: ${projectDetail.error.message}` };
            return;
        }
        const unitsByScope = await getUnitsByScope(projectByScopeId);
        if (unitsByScope.error) {
            context.res = { status: 500, body: `Error: ${unitsByScope.error.message}` };
            return;
        }

        const results = await Promise.all(
            unitsByScope.data.map(async (item) => {
                const resolutionTasks = await getResolutionTasks(item.unitByScopeId);
                if (resolutionTasks.error) {
                    return item;
                }
                item.resolutionTasks = resolutionTasks.data;
                return item;
            })
        );

        context.res = {
            body: {
                projectDetail: projectDetail.data,
                tasks: results
            } as CompletedInspection
        };
    } catch (error) {
        context.res = { status: 500, body: `Unexpected error: ${(error as Error).message}` };
    }
};

export default httpTrigger;
