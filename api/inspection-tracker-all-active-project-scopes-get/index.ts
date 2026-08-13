import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { AssignedProjectScope } from "../interfaces/inspectionTracker";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch active project scopes by install manager');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const userId = context.bindingData.userId;

    const query = `
        SELECT 
            pbs.id AS projectByScopeId,
            pbs.scope_type_id AS scopeTypeId,
            st.scope_name as scopeTypeName,
            dbo_p.id as projectId,
            dbo_p.project_name as projectName
        FROM field_tracker.projects_by_scope pbs
        JOIN field_tracker.projects ft_p
            ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p
            ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.scope_types st
            ON pbs.scope_type_id = st.id
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('userId', sql.Int, userId)
            .query(query);

        context.res = {
            body: result.recordset as AssignedProjectScope[]
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
