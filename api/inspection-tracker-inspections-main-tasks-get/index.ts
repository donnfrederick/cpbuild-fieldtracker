import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { InspectionsMainTasks } from "../interfaces/inspectionTracker/inspectionsMainTasks";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request get List of Inspection Queue Main Tasks");
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const { projectByScopeId } = context.bindingData;

    const query = `
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
                tupbs.phase_name AS taskPhaseName,
                ut.created_at AS dateCreated,
                u.name AS createdBy,
                ut.scheduled_date AS scheduledDate
            FROM field_tracker.units_by_scope ubs
            JOIN field_tracker.project_rows pr 
                ON pr.id = ubs.unit_id
            JOIN field_tracker.unit_phases_by_scope upbs 
                ON ubs.current_phase_id = upbs.id
            JOIN field_tracker.unit_by_scope_status_types ubsst 
                ON ubs.status_id = ubsst.id
            JOIN field_tracker.unit_tasks ut 
                ON ut.unit_by_scope_id = ubs.id
            JOIN field_tracker.unit_phases_by_scope tupbs 
                ON ut.phase_id = tupbs.id
            JOIN field_tracker.task_types tt
                ON ut.task_type_id = tt.id
            JOIN field_tracker.task_status_types tst
                ON ut.status_id = tst.id
            LEFT JOIN dbo.users u
                ON ut.created_by = u.id
            WHERE 
                upbs.phase_name = 'Clear Inspection'
            AND tupbs.phase_name = 'Clear Inspection'
            AND ut.status_id IN (2, 3)
            AND ubs.status_id IN (3, 4)
            AND tt.type_name = 'Main'
            AND ubs.project_by_scope_id = @projectByScopeId`;

    if (!projectByScopeId) {
        context.res = { status: 400, body: "projectByScopeId is required." };
        return;
    }


    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(query);

        context.res = {
            body: result.recordset as InspectionsMainTasks[]
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
