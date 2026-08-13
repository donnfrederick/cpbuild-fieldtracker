import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface WorkSubmissionUpdateData {
    id: number;
    hours?: number;
    hoursOverride?: number;
    quantity?: number;
    quantityOverride?: number;
    submissionNotes?: string;
    managerNotes?: string;
    statusId?: number;
    updatedBy: number;
}

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (id <= 0) return false;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
        return result.recordset[0].count > 0;
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
        return false;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Processing request to update work hour submission.');

    const updateData: WorkSubmissionUpdateData = req.body;

    if (!updateData.id || !updateData.updatedBy) {
        context.res = { status: 400, body: 'Missing required fields: id and updatedBy' };
        return;
    }

    if (!await isValidId(updateData.id, 'field_tracker.work_hour_submissions')) {
        context.res = { status: 400, body: 'Invalid submitted id.' };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = pool.request();

        // Always set `updated_at` and `updated_by`
        const updates: { column: string; value: any; type: sql.ISqlTypeFactory | sql.ISqlTypeWithLength }[] = [
            { column: "updated_at", value: new Date(), type: sql.DateTime },
            { column: "updated_by", value: updateData.updatedBy, type: sql.Int },
        ];

        // Conditionally add fields only if they exist in the request
        if (updateData.hours !== undefined) updates.push({ column: "hours", value: updateData.hours, type: sql.Float });
        if (updateData.hoursOverride !== undefined) updates.push({ column: "hours_override", value: updateData.hoursOverride, type: sql.Float });
        if (updateData.quantity !== undefined) updates.push({ column: "quantity", value: updateData.quantity, type: sql.Float });
        if (updateData.quantityOverride !== undefined) updates.push({ column: "quantity_override", value: updateData.quantityOverride, type: sql.Float });
        if (updateData.submissionNotes !== undefined) updates.push({ column: "submission_notes", value: updateData.submissionNotes, type: sql.NVarChar(500) });
        if (updateData.managerNotes !== undefined) updates.push({ column: "manager_notes", value: updateData.managerNotes, type: sql.NVarChar(500) });
        if (updateData.statusId !== undefined) updates.push({ column: "status_id", value: updateData.statusId, type: sql.Int });

        // If no fields are being updated, return an error
        if (updates.length === 2) {
            context.res = { status: 400, body: 'No valid fields provided for update' };
            return;
        }

        // Generate dynamic SQL query
        const setClause = updates.map((u, i) => `${u.column} = @param${i}`).join(", ");
        const query = `UPDATE field_tracker.work_hour_submissions SET ${setClause} WHERE id = @id;`;

        updates.forEach((u, i) => {
            let sqlTypeInstance;

            if (typeof u.type === "function") {
                sqlTypeInstance = u.type(); // Call the function (e.g., sql.Int(), sql.Float())
            } else {
                sqlTypeInstance = u.type; // Directly use it (e.g., new sql.NVarChar(500))
            }

            request.input(`param${i}`, sqlTypeInstance, u.value);
        });

        request.input('id', sql.Int, updateData.id);

        await request.query(query);
        await transaction.commit();

        context.res = { body: { message: "Updated successfully" } };
    } catch (error) {
        await transaction.rollback();
        context.log(`Error updating work hour submission: ${(error as Error).message}`);
        context.res = { status: 500, body: `An error occurred: ${(error as Error).message}` };
    }
};

export default httpTrigger;