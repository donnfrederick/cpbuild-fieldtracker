import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

interface WorkerRoleTypes {
    roleTypeName: string
}

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function roleTypeName(roleIdsArray: Array<any>, context: Context) {
    const placeholders = roleIdsArray.map((_, index) => `@id${index}`).join(', ');

    const query = `
        SELECT role_type_name as roleTypeName
        FROM field_tracker.worker_role_types
        WHERE id IN (${placeholders})
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        const request = pool.request();

        roleIdsArray.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        const result = await request
            .query(query);

        if (result.recordset.length > 0) {
            const resultArr: string[] = [];
            result.recordset.forEach((row: WorkerRoleTypes) => {
                resultArr.push(row.roleTypeName);
            });

            return resultArr;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list eligible workers with role types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const phasesByScopeId = context.bindingData.phasesByScopeId;
    const roleIds = req.query.roleIds;

    if (!roleIds) {
        context.res = {
            status: 400,
            body: 'No specified roleId.'
        };

        return;
    }

    const roleIdsArray = roleIds.split(',');

    const placeholders = roleIdsArray.map((_, index) => `@id${index}`).join(', ');

    const query = `
        SELECT DISTINCT
            w.id as workerId,
            w.status_id as statusId,
            wst.status_name as workerStatusName,
            u.id as userId,
            u.name as workerName
        FROM field_tracker.workers w
        JOIN field_tracker.worker_status_types wst
            ON w.status_id = wst.id
        JOIN dbo.users u
            ON w.user_id = u.id
        JOIN field_tracker.worker_role_assignments wra
            ON w.id = wra.worker_id
        JOIN field_tracker.worker_role_types wrt
            ON wra.worker_role_type_id = wrt.id
        JOIN field_tracker.scope_phases_role_requirements spr
            ON wrt.id = spr.worker_role_type_id 
        WHERE wrt.scope_type_id = @phasesByScopeId
        AND spr.id IN (${placeholders})
        AND wst.id = 1
        AND wra.is_active = 1
        AND u.active = 1
    `;

    try {
        const request = pool.request();

        roleIdsArray.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        const result = await request
            .input('phasesByScopeId', sql.Int, phasesByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.assignedRoleNames = await roleTypeName(roleIdsArray, context);
            }

            context.res = {
                body: result.recordset
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
