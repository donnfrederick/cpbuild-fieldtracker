import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from "mssql";
import { baseConfig } from "../dbConfig";
import { initializePool } from "../services/dbService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request to create a new subtask.");

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.unit_tasks (unit_by_scope_id, parent_task_id, task_type_id, phase_id, status_id, assigned_worker_id, task_details, created_at, created_by)
        OUTPUT INSERTED.id
        VALUES (@unitByScopeId, @parentTaskId, @taskTypeId, @phaseId, @statusId, @assignedWorkerId, @taskDetails, @createdAt, @createdBy);
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        const insertResult = await request
            .input("unitByScopeId", sql.Int, req.body.unitByScopeId)
            .input("parentTaskId", sql.Int, req.body.parentTaskId)
            .input("taskTypeId", sql.Int, req.body.taskTypeId)
            .input("phaseId", sql.Int, req.body.phaseId)
            .input("statusId", sql.Int, req.body.statusId)
            .input("assignedWorkerId", sql.Int, req.body.assignedWorkerId)
            .input("taskDetails", sql.NVarChar, req.body.taskDetails)
            .input("createdAt", sql.DateTime, new Date())
            .input("createdBy", sql.Int, req.body.createdBy)
            .query(insertQuery);

        await transaction.commit();

        const insertedId = insertResult.recordset[0]?.id;

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
            body: `An error occurred while creating the subtask: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;