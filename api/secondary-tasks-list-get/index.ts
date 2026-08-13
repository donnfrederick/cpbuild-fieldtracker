import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all secondary tasks by worker and project scope.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const workerId = context.bindingData.workerId;
    const projectByScopeId = context.bindingData.projectByScopeId;

    const query = `
        SELECT 
            pr.building,
            pr.building_level as level,
            pr.unit,
            pr.area,
            pr.unit_type as unitType,
            ubs.id as unitByScopeId,
            upbs.phase_name as unitPhaseName,
            ubsst.status_name as unitStatusName,
            upbs.initial_cumulative_percent as progress,
            ut.id as taskId,
            ut.task_type_id as taskTypeId,
            tt.type_name as taskTypeName,
            ut.phase_id as phaseId,
            ut.status_id as taskStatusId,
            tst.status_name as taskStatusName,
            ut.created_at as dateCreated,
            u.name as createdBy,
            ut.scheduled_date as scheduledDate,
            ut.parent_task_id,
            ut.parent_task_id AS parentTaskId,
            ptt.type_name AS parentTaskTypeName,
            pst.status_name AS parentTaskStatusName,
            su.name as secondaryWorkerName
        FROM field_tracker.unit_tasks ut
        JOIN field_tracker.units_by_scope ubs
            ON ut.unit_by_scope_id = ubs.id
        JOIN field_tracker.project_rows pr
            ON ubs.unit_id = pr.id
        JOIN field_tracker.unit_phases_by_scope upbs
            ON ubs.current_phase_id = upbs.id
        JOIN field_tracker.unit_by_scope_status_types ubsst
            ON ubs.status_id = ubsst.id
        JOIN field_tracker.task_types tt
            ON ut.task_type_id = tt.id
        JOIN field_tracker.task_status_types tst
            ON ut.status_id = tst.id
        LEFT JOIN field_tracker.unit_tasks parent_ut
        ON ut.parent_task_id = parent_ut.id
        LEFT JOIN field_tracker.task_types ptt
            ON parent_ut.task_type_id = ptt.id
        LEFT JOIN field_tracker.task_status_types pst
            ON parent_ut.status_id = pst.id
        LEFT JOIN dbo.users u
            ON ut.created_by = u.id
        LEFT JOIN field_tracker.workers sw
            ON ut.secondary_worker_id = sw.id
        LEFT JOIN dbo.users su
            ON sw.user_id = su.id
        WHERE ut.secondary_worker_id = @workerId
        AND ubs.project_by_scope_id = @projectByScopeId
        AND ut.status_id IN (2, 3)
        AND ubs.status_id IN (3, 4)
        AND ut.phase_id = ubs.current_phase_id
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('workerId', sql.Int, workerId)
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 404,
                body: 'No result found.'
            };
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
