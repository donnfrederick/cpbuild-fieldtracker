import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the unit_tasks entry by unitByScopeId and phaseId.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const unitByScopeId = context.bindingData.unitByScopeId;
    const phaseId = context.bindingData.phaseId;

    const query = `
        SELECT
            ut.id as taskId,
            ut.unit_by_scope_id as unitId,
            ut.parent_task_id as parentTaskId,
            put.task_type_id as parentTaskTypeId,
            ptt.type_name as parentTaskTypeName,
            put.status_id as parentStatusId,
            ptst.status_name as parentStatusName,
            ut.task_type_id as taskTypeId,
            tt.type_name as taskTypeName,
            ut.phase_id as phaseId,
            upbs.phase_name as phaseName,
            ut.status_id as statusId,
            tst.status_name as statusName,
            ut.image_acknowledgment as imageAcknowledgmentChecked,
            upbs.image_acknowledgment_text as imageAcknowledgmentText,
            ut.assigned_worker_id as assignedWorkerId,
            u.name as assignedWorkerName,
            ut.scheduled_date as scheduledDate,
            ut.scheduled_by as scheduledById,
            ut.submitted_at as submittedAt,
            ut.submitted_by as submittedBy,
            ut.submission_notes as submissionNotes,
            ut.reviewed_at as reviewedAt,
            ut.reviewed_by as reviewedBy,
            ut.review_notes as reviewNotes,
            ut.task_details as taskDetails,
            ut.created_at as createdAt,
            ut.created_by as createdBy,
            ut.updated_at as updatedAt,
            ut.updated_by as updatedBy,
            ut.deleted_at as deletedAt,
            ut.deleted_by as deletedBy
        FROM field_tracker.unit_tasks ut
        LEFT JOIN field_tracker.unit_tasks put
            ON ut.parent_task_id = put.id
        LEFT JOIN field_tracker.task_types ptt
            ON put.task_type_id = ptt.id
        LEFT JOIN field_tracker.task_status_types ptst
            ON put.status_id = ptst.id
        JOIN field_tracker.task_types tt
            ON ut.task_type_id = tt.id
        JOIN field_tracker.unit_phases_by_scope upbs
            ON ut.phase_id = upbs.id
        JOIN field_tracker.task_status_types tst
            ON ut.status_id = tst.id
        LEFT JOIN field_tracker.workers w
            ON ut.assigned_worker_id = w.id
        LEFT JOIN dbo.users u
            ON w.user_id = u.id
        WHERE ut.unit_by_scope_id = @unitByScopeId
        AND ut.phase_id = @phaseId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('unitByScopeId', sql.Int, unitByScopeId)
            .input('phaseId', sql.Int, phaseId)
            .query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset[0]
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
