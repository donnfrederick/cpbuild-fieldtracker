import { Context } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

export default async function quantityData(unitId: number, context: Context) {
    const qtyData = {
        setQuantity: 0,
        installedQuantities: {
            plannedQuantities: 0,
            addedQuantities: 0
        }
    };

    // First, get setQuantity separately to ensure it always returns
    const setQuantityQuery = `
        SELECT COALESCE(pr.quantity, 0) AS setQuantity
        FROM field_tracker.project_rows pr
        JOIN field_tracker.units_by_scope ubs ON pr.id = ubs.unit_id
        WHERE ubs.id = @unitId
    `;

    // Then, get work hour submissions separately
    const workHourSubmissionsQuery = `
        SELECT
            whs.quantity,
            whst.type_name as workHourSubmissionTypeName
        FROM field_tracker.work_hour_submissions whs
        LEFT JOIN field_tracker.work_hour_submission_types whst ON whs.submit_type_id = whst.id
        LEFT JOIN field_tracker.unit_tasks ut ON whs.task_id = ut.id
        LEFT JOIN field_tracker.units_by_scope ubs ON ut.unit_by_scope_id = ubs.id
        WHERE ubs.id = @unitId
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        // Fetch setQuantity separately
        const setQuantityResult = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(setQuantityQuery);

        if (setQuantityResult.recordset.length > 0) {
            qtyData.setQuantity = setQuantityResult.recordset[0].setQuantity;
        }

        // Fetch work hour submissions separately
        const workHourResult = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(workHourSubmissionsQuery);

        if (workHourResult.recordset.length > 0) {
            for (const entry of workHourResult.recordset) {
                if (entry.workHourSubmissionTypeName === "Planned Quantity") {
                    qtyData.installedQuantities.plannedQuantities += entry.quantity;
                } else if (entry.workHourSubmissionTypeName === "Added Quantity") {
                    qtyData.installedQuantities.addedQuantities += entry.quantity;
                }
            }
        }

        return qtyData;
    } catch (error) {
        context.log(error);
        return qtyData; // Ensure the function always returns at least the setQuantity
    }
}