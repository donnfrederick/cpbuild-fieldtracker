import { Context } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

export default async function fetchMainTasks(unitByScopeId: number, context: Context) {
    context.log('HTTP trigger function processed a request to fetch all unit main tasks.');
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
        .input('unitByScopeId', sql.Int, unitByScopeId)
            .query(`
                SELECT
                    ut.id as taskId,
                    ut.unit_by_scope_id as unitByScopeId,
                    ut.parent_task_id as parentTaskId,
                    ut.task_type_id as taskTypeId,
                    tt.type_name as taskTypeName,
                    ut.phase_id as phaseId,
                    upbs.phase_name as phaseName,
                    upbs.scope_type_id as scopeTypeId,
                    st.scope_name as scopeTypeName,
                    ut.status_id as statusId,
                    tst.status_name as statusName,
                    ut.assigned_worker_id as assignedWorkerId,
                    w.user_id as workerUserId,
                    u.name as assignedWorkerName,
                    ut.scheduled_date as scheduledDate,
                    ut.scheduled_by as scheduledByUserId,
                    ut.submitted_at as submittedAt,
                    ut.submitted_by as submittedByUserId,
                    ut.submission_notes as submissionNotes,
                    ut.reviewed_at as reviewedAt,
                    ut.reviewed_by as reviewedByUserId,
                    ut.review_notes as reviewNotes,
                    ut.task_details as taskDetails,
                    ut.image_acknowledgment as image_acknowledgment,
                    ut.created_at as createdAt,
                    ut.created_by as createdBy,
                    ut.updated_at as updatedAt,
                    ut.updated_by as updatedBy,
                    ut.deleted_at as deletedAt,
                    ut.deleted_by as deletedBy,
                    ut.secondary_worker_id as secondaryWorkerId,
                    su.name as secondaryWorkerName
                FROM field_tracker.unit_tasks ut
                JOIN field_tracker.task_types tt
                    ON ut.task_type_id = tt.id
                JOIN field_tracker.unit_phases_by_scope upbs
                    ON ut.phase_id = upbs.id
                JOIN field_tracker.scope_types st
                    ON upbs.scope_type_id = st.id
                JOIN field_tracker.task_status_types tst
                    ON ut.status_id = tst.id
                LEFT JOIN field_tracker.workers w
                    ON ut.assigned_worker_id = w.id
                LEFT JOIN dbo.users u
                    ON w.user_id = u.id
                LEFT JOIN field_tracker.workers sw
                    ON ut.secondary_worker_id = sw.id
                LEFT JOIN dbo.users su
                    ON sw.user_id = su.id
                WHERE ut.unit_by_scope_id = @unitByScopeId
                AND ut.task_type_id = 1
            `);

        return result.recordset;
    } catch (error) {
        context.log(error);
    }
}