import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get units label info for a specific IHI project scope.');

    const projectScopeId: number = context.bindingData.projectScopeId;

    if (!projectScopeId) {
        context.res = {
            status: 400,
            body: 'The "projectScopeId" parameter is required.'
        };
        return;
    }

    let query = `
    DECLARE @projectScopeId INT = @inputProjectScopeId;

    SELECT
        dbo.projects.project_name AS project_name,
        (
            SELECT
                JSON_QUERY((
                    SELECT
                        pr.building,
                        pr.building_level,
                        pr.area,
                        pr.unit,
                        pr.unit_type
                    FROM field_tracker.project_rows pr
                    INNER JOIN field_tracker.install_teams it ON pr.install_team_id = it.id
                    WHERE
                        pr.field_tracker_project_id = pbs.project_id AND
                        it.team_name = 'IHI Team' AND
                        pr.scope_type_id = pbs.scope_type_id AND
                        pr.deleted_at IS NULL
                    FOR JSON PATH
                )) AS units_by_scope
        ) AS units_by_scope
    FROM field_tracker.projects_by_scope pbs
    INNER JOIN field_tracker.projects ft_projects ON ft_projects.project_id = pbs.project_id
    INNER JOIN dbo.projects ON dbo.projects.id = ft_projects.project_id
    WHERE pbs.id = @inputProjectScopeId;
    `;

    let pool: sql.ConnectionPool;

    try {
        pool = await initializePool(databaseIdentifier, sqlConfig);

        const request = pool.request();
        request.input('inputProjectScopeId', sql.Int, projectScopeId);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            context.res = {
                status: 200,
                body: {
                    projectName: result.recordset[0]?.project_name,
                    unitsByScope: JSON.parse(result.recordset[0]?.units_by_scope || '[]')
                }
            };
        } else {
            context.res = {
                status: 200,
                body: 'No units label info found for the specified IHI project scope.'
            };
        }
    } catch (error) {
        context.log.error('Error executing query:', error);
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;