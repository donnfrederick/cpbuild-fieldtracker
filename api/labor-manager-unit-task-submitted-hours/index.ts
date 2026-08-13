import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const unitTaskId = context.bindingData.unitTaskId;

    const query = `
        SELECT
            whs.id,
            whs.worker_id as workerId,
            u.name as workerName,
            whs.project_by_scope_id as projectByScopeId,
            whs.task_id as taskId,
            whs.role_id as roleId,
            wrt.role_type_name as roleName,
            whs.submit_type_id workHourSubmissionTypeId,
            whst.type_name as workHourSubmissionTypeName,
            whs.status_id as workHourSubmissionStatusId,
            whsst.status_name as workHourSubmissionStatusName,
            whs.last_status_update as lastStatusUpdate,
            whs.status_updated_by as statusUpdatedBy,
            whs.hours,
            whs.hours_override as hoursOverrid,
            whs.quantity,
            whs.quantity_override as quantityOverride,
            whs.submission_date as submissionDate,
            whs.submission_notes as submissionNotes,
            whs.manager_notes as managerNotes,
            whs.created_at as createdAt,
            whs.created_by as createdBy,
            whs.updated_at as updatedAt,
            whs.updated_by as updatedBy,
            whs.deleted_at as deletedAt,
            whs.deleted_by as deletedBy
            FROM field_tracker.work_hour_submissions whs
            LEFT JOIN field_tracker.workers w
                ON whs.worker_id = w.id
            LEFT JOIN dbo.users u
                ON w.user_id = u.id
            LEFT JOIN field_tracker.worker_role_types wrt
                ON whs.role_id = wrt.id
            JOIN field_tracker.work_hour_submission_types whst
                ON whs.submit_type_id = whst.id
            JOIN field_tracker.work_hour_submission_status_types whsst
                ON whs.status_id = whsst.id
            WHERE whs.task_id = @unitTaskId;
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('unitTaskId', sql.Int, unitTaskId)
            .query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 200,
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
