import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the project by scope and work hour submissions.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const projectByScopeId = context.bindingData.projectByScopeId;

    const query = `
        SELECT
            whs.id,
            pbs.id as projectByScopeId,
            st.id as scopeTypeId,
            st.scope_name as scopeTypeName,
            w.id as workerId,
            u.name as workerName,
            whs.task_id as taskId,
            wrt.id as workerRoleTypeId,
            wrt.role_type_name as workerRoleTypeName,
            whst.id as workHourSubmissionTypeId,
            whst.type_name as workHourSubmissionTypeName,
            whsst.id as workHourSubmissionStatusTypeId,
            whsst.status_name as workHourSubmissionStatusTypeName,
            whs.hours,
            whs.hours_override,
            whs.quantity,
            whs.quantity_override
        FROM field_tracker.work_hour_submissions whs
        LEFT JOIN field_tracker.projects_by_scope pbs ON whs.project_by_scope_id = pbs.id
        LEFT JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        LEFT JOIN field_tracker.workers w ON whs.worker_id = w.id
        LEFT JOIN dbo.users u ON w.user_id = u.id
        LEFT JOIN field_tracker.worker_role_types wrt ON whs.role_id = wrt.id
        LEFT JOIN field_tracker.work_hour_submission_types whst ON whs.submit_type_id = whst.id
        LEFT JOIN field_tracker.work_hour_submission_status_types whsst ON whs.status_id = whsst.id
        WHERE pbs.id = @projectByScopeId
        AND whs.status_id = 1
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
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
