import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to check if projects by scope exist.');

    const projectId = context.bindingData.projectId;
    const scopeTypeId = context.bindingData.scopeTypeId;

    if (projectId < 0 || scopeTypeId < 0) {
        context.res = {
            status: 400,
            body: "Project ID or Scope ID is missing from the header request."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            pbs.id,
            dbo_p.id as projectId,
            dbo_p.project_name as projectName,
            pbsst.id as statusId,
            pbsst.status_name as statusName,
            st.id as scopeTypeId,
            st.scope_name as scopeTypeName,
            pbs.deleted_at as deletedAt
        FROM field_tracker.projects_by_scope pbs
        JOIN field_tracker.projects ft_p
            ON pbs.project_id = ft_p.id
        JOIN field_tracker.project_status_types pst
            ON ft_p.project_status_id = pst.id
        JOIN dbo.projects dbo_p
            ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.scope_types st
            ON pbs.scope_type_id = st.id
        JOIN field_tracker.projects_by_scope_status_types pbsst
            ON pbs.status_id = pbsst.id
        WHERE
            pst.status_name = 'active'
            AND st.is_active = 1
            AND pbs.project_id = @projectId
            AND pbs.scope_type_id = @scopeTypeId
        `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectId', sql.Int, projectId)
            .input('scopeTypeId', sql.Int, scopeTypeId)
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
