import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to return all entries from unit_tasks by unitByScopeId and workerId.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const unitByScopeId = context.bindingData.unitByScopeId;
    const workerId = context.bindingData.workerId;

    const query = `
        SELECT
            ut.parent_task_id as parentTaskId,
            ut.id as taskId,
            ubs.unit_id as unitId,
            pr.building,
            pr.building_level as level,
            pr.unit,
            pr.area,
            pr.unit_type as unitType,
            upbs.phase_name as unitPhaseName,
            upbs.initial_cumulative_percent as progress,
            ubsst.status_name as unitStatusName,
            tt.type_name as taskTypeName,
            tst.status_name as taskStatusName,
            ut.scheduled_date as scheduledDate,
            u.name as submittedBy,
            ut.submitted_at as submissionDate,
            ut.reviewed_at as reviewedAt,
            ubs.id as unitByScopeId,
            ubs.project_by_scope_id as projectByScopeId
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
        LEFT JOIN dbo.users u
            ON ut.submitted_by = u.id
        WHERE 
        tt.type_name != 'Main'
        AND ubs.id = @unitByScopeId
        AND ut.assigned_worker_id = @workerId
        AND ut.submitted_at IS NOT NULL
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('unitByScopeId', sql.Int, unitByScopeId)
            .input('workerId', sql.Int, workerId)
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
