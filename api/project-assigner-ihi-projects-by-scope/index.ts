import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getTasks(projectId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query(`
                SELECT
                    pbs.id,
                    pbs.scope_type_id as scopeTypeId,
                    st.scope_name as scopeTypeName,
                    pbs.team_lead_id as teamLeadId,
                    u.name as teamLeadName,
                    pbs.status_id as statusId
                FROM field_tracker.projects_by_scope pbs
                JOIN field_tracker.projects ft_p
                    ON pbs.project_id = ft_p.id
                JOIN field_tracker.scope_types st
                    ON pbs.scope_type_id = st.id
                LEFT JOIN field_tracker.team_leads tl
                    ON pbs.team_lead_id = tl.id
                LEFT JOIN dbo.users u
                    ON tl.user_id = u.id
                WHERE ft_p.project_id = @projectId
                AND pbs.deleted_at IS null;
            `);

        return result.recordset;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get projects by scope depending on status.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
        DISTINCT
            dbo_p.id as projectId,
            dbo_p.project_name as projectName
        FROM field_tracker.projects_by_scope pbs
        JOIN field_tracker.projects ft_p
            ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p
            ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.projects_by_scope_status_types pbsst
            ON pbs.status_id = pbsst.id
        WHERE
            ft_p.project_status_id = 1
            AND pbs.deleted_at IS NULL
            AND pbs.status_id != 5
        `;

    try {
        const request = pool.request();

        const result = await request.query(query);

        for (const row of result.recordset) {
            row.tasks = await getTasks(row.projectId);
        }

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 200,
                body: 'No projects by scope type found.'
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
