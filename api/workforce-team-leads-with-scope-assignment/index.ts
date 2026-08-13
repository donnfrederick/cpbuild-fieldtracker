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
            tl.id,
            usr.name,
            STRING_AGG(st.scope_name, ', ') AS scopeNames,
            wst.status_name AS statusName
        FROM
            field_tracker.team_leads tl
        JOIN
            field_tracker.worker_status_types wst ON tl.status_id = wst.id
        JOIN
            dbo.users usr ON tl.user_id = usr.id
        JOIN
            field_tracker.team_lead_scope_assignments tls ON tl.id = tls.team_lead_id
        JOIN
            field_tracker.scope_types st ON tls.scope_type_id = st.id
        WHERE usr.active = 1
            AND tls.is_active = 1
            AND st.is_active = 1
        GROUP BY
            tl.id, usr.id, usr.name, usr.email, wst.status_name
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
                body: 'No team leads with active assignments found.'
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
