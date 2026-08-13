import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch project scope assignment details.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const projectByScopeId = context.bindingData.projectByScopeId;

    const query = `
        SELECT
            pbs.id,
            pbs.project_id as ftProjectId,
            ft_p.project_id as projectId,
            dbo_p.project_name as projectName,
            pbs.scope_type_id as scopeTypeId,
            st.scope_name as scopeTypeName,
            pbs.status_id as statusId,
            pbsst.status_name as statusName,
            pbs.team_lead_id as teamLeadId,
            u.id as teamLeadUserId
        FROM field_tracker.projects_by_scope pbs
        JOIN field_tracker.projects ft_p
            ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p
            ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.scope_types st
            ON pbs.scope_type_id = st.id
        JOIN field_tracker.projects_by_scope_status_types pbsst
            ON pbs.status_id = pbsst.id
        LEFT JOIN field_tracker.team_leads tl
            ON pbs.team_lead_id = tl.id
        LEFT JOIN dbo.users u
            ON tl.user_id = u.id
        WHERE pbs.id = @projectByScopeId;
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
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
