import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (id <= 0) {
        return false; // Assuming IDs are positive integers
    }

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

async function remainingIssues(unitId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(`
                SELECT id
                FROM field_tracker.blocking_issues
                WHERE unit_id = @unitId
                AND status_id = 1
            `);
            
        return result.recordset;
    } catch (error) {
        console.error(`Error retrieving active blocking_issues entries:`, error);
    }
}

async function updateUnitStatus(unitId: number): Promise<any> {
    const activeIssues = await remainingIssues(unitId);

    if (activeIssues < 1) {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const request = pool.request();
    
            await request
                .input('unitId', sql.Int, unitId)
                .query(`
                    UPDATE field_tracker.units_by_scope
                    SET status_id = 4
                    WHERE id = @unitId
                `);
    
            await transaction.commit();

            return {
                message: "Successfully updated units_by_scope stats"
            };
        } catch (error) {
            console.error(`Error updating units_by_scope status:`, error);
        }
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to resolve a blocking issue.');

    const issueId = context.bindingData.issueId;

    const isValidUnitByScopeId = await isValidId(issueId, "field_tracker.blocking_issues");
    if (!isValidUnitByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid issueId."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.blocking_issues
        SET
            resolution_details = @resolutionDetails,
            status_id = @statusId,
            resolved_at = @resolvedAt,
            resolved_by = @resolvedBy
        WHERE id = @issueId;
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        await request
            .input('issueId', sql.Int, issueId)
            .input('resolutionDetails', sql.NVarChar, req.body.resolutionDetails)
            .input('statusId', sql.Int, req.body.statusId)
            .input('resolvedAt', sql.DateTime, new Date())
            .input('resolvedBy', sql.Int, req.body.resolvedBy)
            .query(updateQuery);

        await transaction.commit();

        await updateUnitStatus(req.body.unitId);

        context.res = {
            status: 200,
            body: {
                message: `Successfully Updated`
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
