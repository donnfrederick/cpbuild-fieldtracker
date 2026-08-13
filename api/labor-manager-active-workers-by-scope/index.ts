import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const scopeTypeId = context.bindingData.scopeTypeId;

    const query = `
        SELECT
            DISTINCT
            w.id as workerId,
            w.status_id as workerStatusId,
            wst.status_name as workerStatusName,
            u.id as workerUserId,
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
        WHERE wrt.scope_type_id = @scopeTypeId
        AND wst.id = 1
        AND wra.is_active = 1
        AND u.active = 1
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(query);

        if (result.recordset.length > 0) {
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
