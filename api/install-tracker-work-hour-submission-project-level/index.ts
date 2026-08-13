import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the project level work hour submission types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const query = `
        SELECT
            whst.id,
            whst.type_name as name,
            whst.task_type_id as taskTypeId,
            tt.type_name as taskTypeName,
            tt.task_level_id as taskLevelId,
            tlt.type_name as taskLevelName
        FROM field_tracker.work_hour_submission_types whst
        JOIN field_tracker.task_types tt
            ON whst.task_type_id = tt.id
        JOIN field_tracker.task_level_types tlt
            ON tt.task_level_id = tlt.id
        WHERE tt.is_active = 1
        AND tlt.is_active = 1
        AND whst.phase_id IS NULL
        AND tlt.id = 2;
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
                status: 400,
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
