import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function hasReadyUnits(projectByScopeId: number, workerId: number): Promise<boolean> {
    const query = `
        SELECT ut.id
        FROM field_tracker.unit_tasks ut
        JOIN field_tracker.units_by_scope ubs
            ON ut.unit_by_scope_id = ubs.id
        WHERE ut.task_type_id in (1, 2, 3, 4)
        AND ut.status_id in (2, 3)
        AND ubs.status_id != 7
        AND ut.phase_id = ubs.current_phase_id
        AND ubs.project_by_scope_id = @projectByScopeId
        AND ut.assigned_worker_id = @workerId
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .input('workerId', sql.Int, workerId)
            .query(query);
        return result.recordset.length > 0;
    } catch (error) {
        console.error(`Error retrieving main tasks:`, error);
    }
    
    return false;
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all active projects_by_scope entries.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const workerId = context.bindingData.workerId;

    const query = `
        SELECT 
            dbo_p.project_name AS projectName,
            pbs.project_id AS fieldTrackerProjectId,
            pbs.id AS projectByScopeId,
            pbs.scope_type_id AS scopeTypeId,
            st.scope_name AS scopeTypeName,
            pbs.team_lead_id AS teamLeadId,
            CASE 
                WHEN EXISTS (
                    SELECT 1
                    FROM field_tracker.units_by_scope ubs
                    JOIN field_tracker.unit_tasks ut ON ubs.id = ut.unit_by_scope_id
                    WHERE ubs.project_by_scope_id = pbs.id
                    AND ut.assigned_worker_id = @workerId
                    AND ut.status_id != 7
                )
                THEN 1 ELSE 0
            END AS hasTaskAssignment
        FROM field_tracker.projects_by_scope pbs
        JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        JOIN field_tracker.projects ft_p ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p ON ft_p.project_id = dbo_p.id
        WHERE pbs.status_id <= 2
        AND pbs.deleted_at IS NULL
    `;

    try {
        const request = pool.request();
        request.input('workerId', sql.Int, workerId);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            const projectMap: any = {};

            for (const row of result.recordset) {
                if (!projectMap[row.fieldTrackerProjectId]) {
                    projectMap[row.fieldTrackerProjectId] = {
                        projectName: row.projectName,
                        fieldTrackerProjectId: row.fieldTrackerProjectId,
                        hasReadyUnits: await hasReadyUnits(row.projectByScopeId, workerId),
                        scopes: []
                    };
                }

                projectMap[row.fieldTrackerProjectId].scopes.push({
                    projectByScopeId: row.projectByScopeId,
                    scopeTypeId: row.scopeTypeId,
                    scopeTypeName: row.scopeTypeName,
                    teamLeadId: row.teamLeadId,
                    hasTaskAssignment: row.hasTaskAssignment === 1
                });
            }

            let projects = Object.values(projectMap);

            context.res = {
                body: projects
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
