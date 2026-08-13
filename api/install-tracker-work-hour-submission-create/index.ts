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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("Processing request to create a new entry in work hour submissions table.");

    const projectByScopeId = context.bindingData.projectByScopeId;

    const isValidWorkerId = await isValidId(req.body.workerId, "field_tracker.workers");
    if (!isValidWorkerId) {
        context.res = {
            status: 400,
            body: "Invalid workerId."
        };
        return;
    }

    const isValidProjectByScopeId = await isValidId(projectByScopeId, "field_tracker.projects_by_scope");
    if (!isValidProjectByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid projectByScopeId."
        };
        return;
    }

    if (req.body.taskId != null) {
        const isValidTaskId = await isValidId(req.body.taskId, "field_tracker.unit_tasks");
        if (!isValidTaskId) {
            context.res = {
                status: 400,
                body: "Invalid taskId."
            };
            return;
        }
    }

    if (req.body.roleId != null) {
        const isValidRoleId = await isValidId(req.body.roleId, "field_tracker.worker_role_types");
        if (!isValidRoleId) {
            context.res = {
                status: 400,
                body: "Invalid roleId."
            };
            return;
        }
    }

    const isValidSubmitTypeId = await isValidId(req.body.submitTypeId, "field_tracker.work_hour_submission_types");
    if (!isValidSubmitTypeId) {
        context.res = {
            status: 400,
            body: "Invalid submitTypeId."
        };
        return;
    }

    const isValidTeamLeadId = await isValidId(req.body.teamLeadId, "field_tracker.team_leads");
    if (!isValidTeamLeadId) {
        context.res = {
            status: 400,
            body: "Invalid teamLeadId."
        };
        return;
    }

    const isValidCreatedBy = await isValidId(req.body.createdBy, "dbo.users");
    if (!isValidCreatedBy) {
        context.res = {
            status: 400,
            body: "Invalid createdBy."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    let insertQueryInsert = `INSERT INTO field_tracker.work_hour_submissions (worker_id, project_by_scope_id`;

    if (req.body.taskId != null) {
        insertQueryInsert += `, task_id`;
    }

    if (req.body.roleId != null) {
        insertQueryInsert += `, role_id`;
    }

    if (req.body.quantity != null) {
        insertQueryInsert += `, quantity`;
    }

    insertQueryInsert += `, submit_type_id, status_id, hours, submission_date, submission_notes, team_lead_id, created_at, created_by)`;

    let insertQueryValues = `
        VALUES (@workerId, @projectByScopeId`;

    if (req.body.taskId != null) {
        insertQueryValues += `, @taskId`;
    }

    if (req.body.roleId != null) {
        insertQueryValues += `, @roleId`;
    }

    if (req.body.quantity != null) {
        insertQueryValues += `, @quantity`;
    }

    insertQueryValues += `, @submitTypeId, 1, @hours, @submissionDate, @submissionNotes, @teamLeadId, @createdAt, @createdBy);`;

    const insertQuery = `
        ${insertQueryInsert}
        ${insertQueryValues}
        SELECT SCOPE_IDENTITY() AS insertedId;
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        if (req.body.taskId != null) {
            request.input('taskId', sql.Int, req.body.taskId);
        }

        if (req.body.roleId != null) {
            request.input('roleId', sql.Int, req.body.roleId);
        }

        const insertResult = await request
            .input("workerId", sql.Int, req.body.workerId)
            .input("projectByScopeId", sql.Int, projectByScopeId)
            .input("submitTypeId", sql.Int, req.body.submitTypeId)
            .input("hours", sql.Decimal(10, 2), req.body.hours)
            .input("quantity", sql.Decimal(10, 2), req.body.quantity)
            .input("submissionDate", sql.DateTime, new Date())
            .input("submissionNotes", sql.NVarChar, req.body.submissionNotes)
            .input("teamLeadId", sql.Int, req.body.teamLeadId)
            .input("createdAt", sql.DateTime, new Date())
            .input("createdBy", sql.Int, req.body.createdBy)
            .query(insertQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: {
                submissionId: insertResult.recordset[0].insertedId,
                message: "New work hour submission has been created."
            }
        };
    } catch (error) {
        await transaction.rollback();
        context.res = {
            status: 500,
            body: `An error occurred while inserting new entry: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;