import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function fetch project data.');

    const projectId = context.bindingData.projectId;

    if (!projectId) {
        context.res = {
            status: 400,
            body: "Project ID is required."
        };
        return;
    }

    const pool = await initializePool(baseConfig.toolsDashboard.database, baseConfig.toolsDashboard);
    const request = new sql.Request(pool);

    const query = `
        SELECT
            ftProjects.bulk_transaction_id,
            ftBulkTransactions.transaction_type
        FROM field_tracker.projects ftProjects
        JOIN field_tracker.bulk_transactions ftBulkTransactions
        ON ftProjects.bulk_transaction_id = ftBulkTransactions.id
        WHERE ftProjects.id = @projectId
    `;

    try {
        const result = await request
            .input('projectId', sql.Int, projectId)
            .query(query);
        if (result.recordset.length > 0) {
            context.res = {
                status: 200,
                body: result.recordset[0]
            };
        } else {
            context.res = {
                status: 404,
                body: `Project not found.`
            };
        }
    } catch (error) {
        context.log(`An error occured:`, error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + (error as Error).message
        };
    }
};

export default httpTrigger;
