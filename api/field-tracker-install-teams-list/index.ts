import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get all install teams.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const query = `
        SELECT
            it.id,
            it.team_name as teamName,
            it.status_id as statusId,
            it.created_at as createdAt,
            it.created_by as createdBy,
            it.updated_at as updatedAt,
            it.updated_by as updatedBy,
            it.deleted_at as deletedAt,
            it.deleted_by as deletedBy,
            itst.status_name as statusName,
            u.name as creatorName
        FROM
            field_tracker.install_teams it
        JOIN
            field_tracker.install_teams_status_types itst
        ON
            it.status_id = itst.id
        JOIN
            dbo.users u
        ON
            it.created_by = u.id
        WHERE
            it.deleted_at IS NULL
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
                body: 'No install teams found.'
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
