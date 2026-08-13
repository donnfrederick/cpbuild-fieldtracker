import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch a blocking issue.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const blockingIssueId = context.bindingData.blockingIssueId;

    const query = `
        SELECT
            bi.id,
            bi.unit_id as unitId,
            bi.task_id as taskId,
            bi.issue_details as issueDetails,
            bi.status_id as statusId,
            bist.status_name as statusName,
            bi.created_at as createdAt,
            bi.created_by as createdBy,
            bi.resolved_at as resolvedAt,
            bi.resolved_by as resolvedBy,
            bi.resolution_details as resolutionDetails,
            bi.updated_at as updatedAt,
            bi.updated_by as updatedBy,
            bi.deleted_at as deletedAt,
            bi.deleted_by as deletedBy
        FROM field_tracker.blocking_issues bi
        JOIN field_tracker.blocking_issue_status_types bist
            ON bi.status_id = bist.id
        WHERE bi.id = @blockingIssueId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('blockingIssueId', sql.Int, blockingIssueId)
            .query(query);

        if (result.recordset.length > 0) {
            context.res = {
                body: result.recordset[0]
            };
        } else {
            context.res = {
                status: 404,
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
