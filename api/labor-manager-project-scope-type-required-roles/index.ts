import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface EligibleRoleIds {
    workerRoleTypeId: number
}

async function eligibleRoleIds(phaseId: number, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('phaseId', sql.Int, phaseId)
            .query(`
                SELECT
                    worker_role_type_id as workerRoleTypeId
                FROM field_tracker.scope_phases_role_requirements
                WHERE phase_id = @phaseId
            `);
        
        if (result.recordset.length > 0) {
            const roleIds: number[]  = [];

            result.recordset.forEach((data: EligibleRoleIds) => {
                roleIds.push(data.workerRoleTypeId);
            });

            return roleIds;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

async function roleAssignments(scopeTypeId: number, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(`
                SELECT
                    id as phaseId,
                    phase_name as taskName,
                    phase_order as taskOrder,
                    worker_assignment_display_name as roleDisplayName
                FROM field_tracker.unit_phases_by_scope
                WHERE scope_type_id = @scopeTypeId
                AND worker_assignment_required = 1
            `);
        
        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.eligibleRoleIds = await eligibleRoleIds(row.phaseId, context);
            }
            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

async function scopeType(scopeTypeId: number, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(`
                SELECT
                    id as scopeTypeId,
                    scope_name as scopeTypeName
                FROM field_tracker.scope_types
                WHERE id = @scopeTypeId
            `);
        
        if (result.recordset.length > 0) {
            return result.recordset[0];
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all eligible role assignments by scope type id.');

    const scopeTypeId = context.bindingData.scopeTypeId;

    try {
        const scope = await scopeType(scopeTypeId, context);

        scope.roleAssignments = await roleAssignments(scopeTypeId, context);
        
        context.res = {
            status: 200,
            body: {
                message: "Successfully retrieved eligible role assignments",
                result: scope
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
