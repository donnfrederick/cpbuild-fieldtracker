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
    const workHourSubmissionTypeId = context.bindingData.workHourSubmissionTypeId;

    const query = `
        SELECT
            whst.id,
            whst.type_name as typeName,
            tt.id as taskTypeId,
            tt.type_name as taskTypeName,
            tt.description as taskTypeDescription,
            upbs.id as unitPhasesByScopeId,
            upbs.phase_name as unitPhasesByScopeName,
            wpt.id as workPayTypeId,
            wpt.type_name as workPayTypeName
        FROM field_tracker.work_hour_submission_types whst
        LEFT JOIN field_tracker.task_types tt ON whst.task_type_id = tt.id
        LEFT JOIN field_tracker.unit_phases_by_scope upbs ON whst.phase_id = upbs.id
        LEFT JOIN field_tracker.work_pay_types wpt ON whst.pay_type_id = wpt.id
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .input('workHourSubmissionTypeId', sql.Int, workHourSubmissionTypeId)
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
