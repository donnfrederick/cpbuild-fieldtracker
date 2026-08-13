import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch project rows that has IHI Team enabled.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const ftProjectId = context.bindingData.ftProjectId;

    const query = `
        SELECT
            id,
            scope_type_id as scopeTypeId
        FROM field_tracker.project_rows
        WHERE field_tracker_project_id = @ftProjectId
        AND install_team_id = 1
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('ftProjectId', sql.Int, ftProjectId)
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
