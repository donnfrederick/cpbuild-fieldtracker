import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get projects by scope depending on status.');

    const projectRowId = context.bindingData.projectRowId;

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            ubs.id,
            ft_p.project_id as projectId,
            dbo_p.project_name as projectName,
            st.id as scopeTypeId,
            st.scope_name as scopeTypeName,
            ubs.unit_id as unitId,
            upbs.id as phaseId,
            upbs.phase_name as phaseName,
            ubsst.id as statusId,
            ubsst.status_name as statusName,
            ubs.staging_completion_date as completionDate,
            ubs.deleted_at as deletedAt
        FROM field_tracker.units_by_scope ubs
        JOIN field_tracker.projects_by_scope pbs ON ubs.project_by_scope_id = pbs.id
        JOIN field_tracker.projects ft_p ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id
        JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id
        WHERE ubs.unit_id = @projectRowId
        `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectRowId', sql.Int, projectRowId)
            .query(query);

        const returnBody = result.recordset.length > 0 ? {result: result.recordset} : {result: null};

        context.res = {
            body: returnBody
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
