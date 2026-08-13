import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get team leads with scope assignments.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            wr.id,
            usr.name,
            STUFF((
                SELECT DISTINCT ', ' + wrt.role_type_name
                FROM field_tracker.workers wr
                JOIN field_tracker.worker_role_assignments wra ON wr.id = wra.worker_id
                JOIN field_tracker.worker_role_types wrt ON wra.worker_role_type_id = wrt.id
                WHERE wr.user_id = usr.id
                AND wra.is_active = 1
                AND wrt.is_active = 1
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS roleTypes,

            STUFF((
                SELECT DISTINCT ', ' + st.scope_name
                FROM field_tracker.workers wr
                JOIN field_tracker.worker_role_assignments wra ON wr.id = wra.worker_id
                JOIN field_tracker.worker_role_types wrt ON wra.worker_role_type_id = wrt.id
                JOIN field_tracker.scope_types st ON wrt.scope_type_id = st.id
                WHERE wr.user_id = usr.id
                AND wra.is_active = 1
                AND wrt.is_active = 1
                AND st.is_active = 1
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS scopeTypes,

            STUFF((
                SELECT DISTINCT ', ' + CAST(wra.worker_role_type_id AS NVARCHAR(MAX))
                FROM field_tracker.workers wr
                JOIN field_tracker.worker_role_assignments wra ON wr.id = wra.worker_id
                WHERE wr.user_id = usr.id
                AND wra.is_active = 1
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS workerRoleTypeIds,

            wst.status_name AS statusName

        FROM
            dbo.users usr
        JOIN
            field_tracker.workers wr ON wr.user_id = usr.id
        JOIN
            field_tracker.worker_status_types wst ON wr.status_id = wst.id

        WHERE
            usr.active = 1
        GROUP BY
            usr.id, usr.name, usr.email, wr.id, wst.status_name;
        `;

    try {
        const request = pool.request();
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 200,
                body: 'No workers with active roles found.'
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
