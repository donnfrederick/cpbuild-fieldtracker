import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get team leads with scope assignments.');

    const status = context.bindingData.status;

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            tl.id,
            usr.name,
            wst.status_name AS statusName
        FROM
            field_tracker.team_leads tl
        JOIN
            field_tracker.worker_status_types wst ON tl.status_id = wst.id
        JOIN
            dbo.users usr ON tl.user_id = usr.id
        WHERE usr.active = 1
            AND deleted_at IS NULL
        `;

    if (status !== "all") {
        query += ` AND wst.status_name = @status`;
    }

    try {
        const request = pool.request();

        if (status !== "all") {
            request.input('status', sql.VarChar, status);
        }

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
