import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { generateSasUrlLocal, generateSasUrlDeployed } from "../services/azureBlobStorageService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const isLocal = process.env.IsLocal === "true";

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

async function submissionImages(submissionId: number, context: Context) {
    const query = `
        SELECT
            id,
            file_url as fileUrl,
            thumbnail_url as thumbnailUrl,
            image_name as name,
            image_description as description
        FROM field_tracker.image_uploads
        WHERE submission_id = @submissionId
        AND submission_location = @submissionLocation
        AND submission_type_id = 1
        AND upload_status_id = 2;
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.work_hour_submissions')
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                if (isLocal) {
                    row.fileUrl = await generateSasUrlLocal(row.fileUrl);
                    row.thumbnailUrl = await generateSasUrlLocal(row.thumbnailUrl);
                } else {
                    row.fileUrl = await generateSasUrlDeployed(row.fileUrl);
                    row.thumbnailUrl = await generateSasUrlDeployed(row.thumbnailUrl);
                }
            }

            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list work hour submissions for project level.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const workerId = context.bindingData.workerId;
    const taskId = context.bindingData.taskId;

    const isValidWorkerId = await isValidId(workerId, "field_tracker.workers");
    if (!isValidWorkerId) {
        context.res = {
            status: 400,
            body: "Invalid workerId."
        };
        return;
    }

    const isValidTaskId = await isValidId(taskId, "field_tracker.unit_tasks");
    if (!isValidTaskId) {
        context.res = {
            status: 400,
            body: "Invalid taskId."
        };
        return;
    }

    const query = `
        SELECT
            whs.id,
            dbo_p.project_name as projectName,
            st.scope_name as scopeTypeName,
            whs.submit_type_id as submitTypeId,
            whst.type_name as submitTypeName,
            whs.status_id as statusId,
            whsst.status_name as statusName,
            whs.hours,
            whs.quantity,
            whs.submission_date as submissionDate,
            u.name as submittedBy,
            whs.submission_notes as submissionNotes,
            whs.manager_notes as managerNotes,
            whs.hours_override as hoursOverride,
            whs.quantity_override as quantityOverride
        FROM field_tracker.work_hour_submissions whs
        JOIN field_tracker.projects_by_scope pbs
            ON whs.project_by_scope_id = pbs.id
        JOIN field_tracker.projects ft_p
            ON pbs.project_id = ft_p.id
        JOIN dbo.projects dbo_p
            ON ft_p.project_id = dbo_p.id
        JOIN field_tracker.scope_types st
            ON pbs.scope_type_id = st.id
        JOIN field_tracker.work_hour_submission_types whst
            ON whs.submit_type_id = whst.id
        JOIN field_tracker.work_hour_submission_status_types whsst
            ON whs.status_id = whsst.id
        JOIN field_tracker.task_types tt
            ON whst.task_type_id = tt.id
        JOIN field_tracker.task_level_types tlt
            ON tt.task_level_id = tlt.id
        JOIN field_tracker.workers w
            ON whs.worker_id = w.id
        JOIN dbo.users u
            ON w.user_id = u.id
        WHERE tlt.id = 1
        AND whs.task_id = @taskId;
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('workerId', sql.Int, workerId)
            .input('taskId', sql.Int, taskId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.images = await submissionImages(row.id, context);
            }

            context.res = {
                body: result.recordset
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
