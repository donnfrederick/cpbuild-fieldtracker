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
                    main_task_required mainTaskRequired
                FROM field_tracker.unit_phases_by_scope
                WHERE scope_type_id = @scopeTypeId;
            `);

        return result.recordset;
    } catch (error) {
        console.error(`Error retrieving active blocking_issues entries:`, error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all unit phases and unit by scope status types.');

    const scopeTypeId = context.bindingData.scopeTypeId;

    context.res = {
        body: {
            unitPhases: await getUnitPhases(scopeTypeId)
        }
    };
};

export default httpTrigger;