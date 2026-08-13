import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get workforce roles by scope tyep ID or all.');

    const scopeTypeId = context.bindingData.scopeTypeId;

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            wrt.id,
            wrt.role_type_name,
            st.scope_name,
            wrt.description
        FROM
            field_tracker.worker_role_types wrt
        JOIN
            field_tracker.scope_types st
        ON
            wrt.scope_type_id = st.id
        WHERE
            wrt.is_active = 1`;

    if (scopeTypeId != "all") {
        query += ` AND wrt.scope_type_id = ${scopeTypeId}`;
    }

    try {
        const request = pool.request();
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 404,
                body: 'No worker role types found.'
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
