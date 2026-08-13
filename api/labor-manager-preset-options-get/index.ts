import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getUnitPhases(scopeTypeId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(`
                SELECT
                    id,
                    phase_name as phaseName,
                    scope_type_id as scopeTypeId,
                    phase_order as phaseOrder,
                    version,
                    main_task_required as mainTaskRequired,
                    worker_assignment_required as workerAssignmentRequired,
                    worker_assignment_display_name as workerAssignmentDisplayName,
                    has_checklist_items as hasChecklistItems,
                    scheduling_required as schedulingRequired,
                    incremental_weight_percent as incrementalWeightPercent,
                    initial_cumulative_percent as initialCumulativePercent,
                    final_cumulative_percent as finalCumulativePercent,
                    description
                FROM field_tracker.unit_phases_by_scope
                WHERE scope_type_id = @scopeTypeId;
            `);

        return result.recordset;
    } catch (error) {
        console.error(`Error retrieving unit phases data:`, error);
    }
}

async function getUnitByScopeStatusTypes(): Promise<any> {

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .query(`
                SELECT
                    id,
                    status_name as statusName,
                    description
                FROM field_tracker.unit_by_scope_status_types
                WHERE is_active = 1;
            `);

        return result.recordset;
    } catch (error) {
        console.error(`Error retrieving units by scope status types data:`, error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all unit phases and unit by scope status types.');

    const scopeTypeId = context.bindingData.scopeTypeId;

    context.res = {
        body: {
            unitPhases: await getUnitPhases(scopeTypeId),
            unitScopeStatusTypes: await getUnitByScopeStatusTypes()
        }
    };
};

export default httpTrigger;
