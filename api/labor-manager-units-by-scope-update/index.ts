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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request to update staging completion date.");

    const unitId = context.bindingData.unitId;

    const isValidUnitByScopeId = await isValidId(unitId, "field_tracker.units_by_scope");
    if (!isValidUnitByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid unitId.",
        };
        return;
    }

    const isValidScopePhaseId = await isValidId(req.body.newPhaseId, "field_tracker.unit_phases_by_scope");
    if (!isValidScopePhaseId) {
        context.res = {
            status: 400,
            body: "Invalid newPhaseId.",
        };
        return;
    }

    const isValidStatusId = await isValidId(req.body.statusId, "field_tracker.unit_by_scope_status_types");
    if (!isValidStatusId) {
        context.res = {
            status: 400,
            body: "Invalid statusId.",
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.units_by_scope
        SET
            staging_completion_date = CASE
                WHEN @completionDate IS NULL THEN NULL
                ELSE @completionDate
            END,
            current_phase_id = @newPhaseId,
            status_id = @statusId,
            updated_at = @updatedAt,
            updated_by = @updatedBy
        WHERE id = @unitId;
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        // Convert incoming completionDate properly
        let completionDate = req.body.completionDate ? new Date(req.body.completionDate) : null;

        // Handle potential invalid date conversion
        if (completionDate && isNaN(completionDate.getTime())) {
            completionDate = null;
        }

        // If valid date, set time to 23:59:59.999 to avoid timezone shifts
        if (completionDate) {
            completionDate.setHours(23, 59, 59, 999);
        }

        await request
            .input("unitId", sql.Int, unitId)
            .input("completionDate", sql.DateTime, completionDate) // Allows NULL
            .input("newPhaseId", sql.Int, req.body.newPhaseId)
            .input("statusId", sql.Int, req.body.statusId)
            .input("updatedAt", sql.DateTime, new Date())
            .input("updatedBy", sql.Int, req.body.updatedBy)
            .query(updateQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: "Successfully Updated" },
        };
    } catch (error) {
        await transaction.rollback();
        context.log.error("Error updating staging completion date:", error);
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`,
        };
    }
};

export default httpTrigger;
