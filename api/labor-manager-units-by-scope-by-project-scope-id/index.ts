import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import blockingIssues from "../units-by-scope-blocking-issues/index";
import quantityData from "../units-by-scope-quantity-data/index";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const projectByScopeId = context.bindingData.projectByScopeId;

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
            ubs.staging_completion_date AS completionDate
        FROM field_tracker.units_by_scope ubs
        LEFT JOIN field_tracker.projects_by_scope pbs ON ubs.project_by_scope_id = pbs.id
        LEFT JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        LEFT JOIN field_tracker.project_rows pr ON ubs.unit_id = pr.id
        LEFT JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id
        LEFT JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id
        WHERE pbs.id = @projectByScopeId
        AND ubs.status_id != 9;
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.blockingIssues = await blockingIssues(row.id, context);
                row.quantities = await quantityData(row.id, context);

                row.mainTasks = [];
                row.subtasks = [];
            }


            context.res = {
                body: {
                    message: "Successfully retrieved units info",
                    result: result.recordset
                }
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
