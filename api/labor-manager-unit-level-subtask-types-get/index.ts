import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all non-main tasks.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const query = `
        SELECT
            id,
            type_name as typeName,
            description,
            task_level_id as taskLevelId,
            work_classification_id as workClassificationId,
            is_active as isActive
        FROM field_tracker.task_types
        WHERE id >= 2
        AND id <= 4;
    `;

    try {
        const request = pool.request();

        const result = await request
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
