import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import blockingIssues from "../units-by-scope-blocking-issues/index";
import quantityData from "../units-by-scope-quantity-data/index";
import fetchSubTasks from "../labor-manager-unit-sub-tasks-get/fetchSubTasks";
import fetchMainTasks from "../labor-manager-unit-main-tasks-get/fetchMainTasks";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch a specific unit by scope.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const unitByScopeId = context.bindingData.unitByScopeId; // Expecting unitByScopeId from route parameters

    const query = `
        SELECT
            ubs.id,
            pbs.id AS projectByScopeId,
            pbs.scope_type_id AS projectScopeTypeId,
            st.scope_name AS projectScopeTypeName,
            pr.id AS fieldTrackerProjectRowId,
            pr.building,
            pr.building_level AS level,
            pr.unit,
            pr.area,
            pr.unit_type AS unitType,
            ubs.current_phase_id AS currentPhaseId,
            upbs.phase_name AS currentPhaseName,
            upbs.initial_cumulative_percent AS unitProgressPercent,
            upbs.incremental_weight_percent AS incrementalWeightPercent,
            upbs.initial_cumulative_percent AS initialCumulativePercent,
            upbs.final_cumulative_percent AS finalCumulativePercent,
            ubs.status_id AS unitStatusId,
            ubsst.status_name AS unitStatusName,
            ubs.staging_completion_date AS completionDate,
            p.project_name AS projectName -- Added project name

        FROM field_tracker.units_by_scope ubs
        LEFT JOIN field_tracker.projects_by_scope pbs ON ubs.project_by_scope_id = pbs.id
        LEFT JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        LEFT JOIN field_tracker.project_rows pr ON ubs.unit_id = pr.id
        LEFT JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id
        LEFT JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id
        LEFT JOIN field_tracker.projects fp ON pbs.project_id = fp.id -- Join to get project_id
        LEFT JOIN dbo.projects p ON fp.project_id = p.id -- Join to get project_name

        WHERE ubs.id = @unitByScopeId;
    `;

    try {
        const request = pool.request();
        const result = await request
            .input('unitByScopeId', sql.Int, unitByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.blockingIssues = await blockingIssues(row.id, context);
                row.quantities = await quantityData(row.id, context);

                row.mainTasks = await fetchMainTasks(row.id, context);
                row.subtasks = await fetchSubTasks(row.id, context);
            }

            context.res = {
                body: {
                    message: "Successfully retrieved unit info",
                    result: result.recordset[0] // Return only the first matching unit
                }
            };
        } else {
            context.res = {
                status: 200,
                body: { message: "No result found." }
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