import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getTasks(projectId: number, teamLeadId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('teamLeadId', sql.Int, teamLeadId)
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
                AND pbs.team_lead_id = @teamLeadId
                AND pbs.deleted_at IS null;
            `);

        return result.recordset;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
};

async function projectAssignments(teamLeadId: number): Promise<any> {
    if (teamLeadId <= 0) {
        return; // Assuming IDs are positive integers
    }

    const query = `
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
            AND pbs.status_id IN (1, 2)
            AND pbs.team_lead_id = @teamLeadId;
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('teamLeadId', sql.Int, teamLeadId)
            .query(query);

        for (const row of result.recordset) {
            row.tasks = await getTasks(row.projectId, teamLeadId);
        }

        return result.recordset;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the active Team Leads along with their scope assignments.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const teamLeadId = context.bindingData.teamLeadId;

    let query = `
        SELECT
            tl.id,
            usr.name
        FROM
            field_tracker.team_leads tl
        JOIN
            field_tracker.worker_status_types wst ON tl.status_id = wst.id
        JOIN
            dbo.users usr ON tl.user_id = usr.id
        WHERE usr.active = 1
            AND tl.status_id = 1
            AND tl.id = @teamLeadId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('teamLeadId', sql.Int, teamLeadId)
            .query(query);

        if (result.recordset.length > 0) {
            result.recordset[0].projectAssignment = await projectAssignments(result.recordset[0].id);

            context.res = {
                body: result.recordset[0]
            };
        } else {
            context.res = {
                status: 200,
                body: 'No team leads found.'
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
