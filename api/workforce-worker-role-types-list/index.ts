import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function roleTypesByScope() {
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            st.scope_name as scopeName,
            STRING_AGG(wrt.role_type_name, ', ') AS roleTypeNames
        FROM
            field_tracker.worker_role_types wrt
        JOIN
            field_tracker.scope_types st ON wrt.scope_type_id = st.id
        WHERE
            wrt.is_active = 1
            AND st.is_active = 1
        GROUP BY
            st.scope_name
        `;
    const result = await pool.request().query(query);
    
    return result.recordset;
}

async function roleTypes() {
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            wrt.id,
            wrt.role_type_name AS roleTypeName,
            st.id as scopeTypeId,
            st.scope_name as scopeName
        FROM
            field_tracker.worker_role_types wrt
        JOIN
            field_tracker.scope_types st ON wrt.scope_type_id = st.id
        WHERE
            wrt.is_active = 1
            AND st.is_active = 1
        `;
    const result = await pool.request().query(query);
    
    return result.recordset;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get role types list.');
    try {
        const byScope = await roleTypesByScope();
        const roles = await roleTypes();
        if (byScope.length > 0 && roles.length > 0) {
            context.res = {
                body: {
                    byScope,
                    roles
                }
            };
        } else {
            context.res = {
                status: 404,
                body: 'No active worker role types found.'
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
