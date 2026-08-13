import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from "mssql";
import { baseConfig } from "../dbConfig";
import { initializePool } from "../services/dbService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (id <= 0) return false; // IDs must be positive integers

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool
            .request()
            .input("id", sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
    }
    return false; // Default to false if any error occurs
}

async function updateUnitsByScope(unitByScopeId: number, context: Context): Promise<void> {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.units_by_scope
        SET status_id = @statusId
        WHERE id = @unitId
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        await request
            .input("unitId", sql.Int, unitByScopeId)
            .input("statusId", sql.Int, 7)
            .query(updateQuery);

        await transaction.commit();
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred while updating units_by_scope: ${(error as Error).message}`
        };
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request to create a new blocking issue.");

    const unitByScopeId = context.bindingData.unitByScopeId;

    const isValidUnitByScopeId = await isValidId(unitByScopeId, "field_tracker.units_by_scope");
    if (!isValidUnitByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid unitByScopeId."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.blocking_issues (unit_id, issue_details, issue_type_id, responsible_party_id, status_id, created_at, created_by)
        VALUES (@unitId, @issueDetails, @issueType, @responsibleParty, @statusId, @createdAt, @createdBy);
        SELECT SCOPE_IDENTITY() AS id; -- Retrieve the inserted ID
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        const insertResult = await request
            .input("unitId", sql.Int, unitByScopeId)
            .input("issueType", sql.Int, req.body.issueType)
            .input("responsibleParty", sql.Int, req.body.responsibleParty)
            .input("issueDetails", sql.NVarChar, req.body.issueDetails)
            .input("statusId", sql.Int, req.body.statusId)
            .input("createdAt", sql.DateTime, new Date())
            .input("createdBy", sql.Int, req.body.createdBy)
            .query(insertQuery);

        await transaction.commit();

        const insertedId = insertResult.recordset[0]?.id; // Safely retrieve ID

        await updateUnitsByScope(unitByScopeId, context);

        context.res = {
            status: 200,
            body: {
                submissionId: insertedId,
                message: "New blocking issue has been created."
            }
        };
    } catch (error) {
        await transaction.rollback();
        context.res = {
            status: 500,
            body: `An error occurred while inserting the blocking issue: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;