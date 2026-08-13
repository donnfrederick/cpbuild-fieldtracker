import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { generateSasUrlLocal, generateSasUrlDeployed } from "../services/azureBlobStorageService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const isLocal = process.env.IsLocal === "true";

async function getClearInspection(taskId: number, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        const result = await pool.request()
            .input('taskId', sql.Int, taskId)
            .query(`
                SELECT
                    cici.id,
                    cici.task_id as taskId,
                    cici.item_type_id as itemTypeId,
                    cicit.item_name as itemTypeName,
                    cicit.description as itemTypeDescription,
                    cicit.phase_id as itemTypePhaseId,
                    cicit.sort_order as itemTypeSortOrder,
                    cicit.version as itemTypeVersion,
                    cicit.is_required as itemTypeIsRequire,
                    cicit.is_active as itemTypeIsActive,
                    cici.is_checked as isChecked,
                    cici.checked_by as checkedBy,
                    cici.checked_at as checkedAt,
                    cici.created_at as createdAt,
                    cici.created_by as createdBy,
                    cici.updated_at as updatedAt,
                    cici.updated_by as updatedBy,
                    cici.deleted_at as deletedAt,
                    cici.deleted_by as deletedBy
                FROM field_tracker.clear_inspection_checklist_items cici
                JOIN field_tracker.clear_inspection_checklist_item_types cicit
                    ON cici.item_type_id = cicit.id
                WHERE cici.task_id = @taskId
            `);

        if (result.recordset.length > 0) {
            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(`Error retrieving image_uploads entries:`, error);
    }
}

async function getImageUploads(submissionId: number, req: HttpRequest, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        const result = await pool.request()
            .input('uploadStatusId', sql.Int, 2)
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.unit_tasks')
            .input('submissionTypeId', sql.Int, 2)
            .query(`
                SELECT
                    iu.id as uploadId,
                    iu.submission_type_id as submissionTypeId,
                    ist.type_name as submissionTypeName,
                    iu.submission_location as submissionLocation,
                    iu.submission_id as submissionId,
                    iu.upload_status_id as uploadStatusId,
                    iust.status_name as uploadstatusName,
                    iu.file_url as url,
                    iu.thumbnail_url as thumbnailUrl,
                    iu.file_name as fileName,
                    iu.image_name as imageName,
                    iu.image_description as imageDescription,
                    iu.created_at as uploadedAt,
                    iu.created_by as uploadedBy
                FROM field_tracker.image_uploads iu
                JOIN field_tracker.image_submission_types ist
                    ON iu.submission_type_id = ist.id
                JOIN field_tracker.image_upload_status_types iust
                    ON iu.upload_status_id = iust.id
                WHERE iu.submission_type_id = @submissionTypeId
                AND iu.submission_location = @submissionLocation
                AND iu.submission_id = @submissionId
                AND iu.upload_status_id = @uploadStatusId
                AND iu.deleted_at IS NULL;
            `);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                if (isLocal) {
                    row.url = await generateSasUrlLocal(row.url);
                    row.thumbnailUrl = await generateSasUrlLocal(row.thumbnailUrl);
                } else {
                    row.url = await generateSasUrlDeployed(row.url);
                    row.thumbnailUrl = await generateSasUrlDeployed(row.thumbnailUrl);
                }
            }

            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(`Error retrieving image_uploads entries:`, error);
    }
}

async function getProofImageUploads(submissionId: number, req: HttpRequest, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        const result = await pool.request()
            .input('uploadStatusId', sql.Int, 2)
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.unit_tasks')
            .input('submissionTypeId', sql.Int, 3)
            .query(`
                SELECT
                    iu.id as uploadId,
                    iu.submission_type_id as submissionTypeId,
                    ist.type_name as submissionTypeName,
                    iu.submission_location as submissionLocation,
                    iu.submission_id as submissionId,
                    iu.upload_status_id as uploadStatusId,
                    iust.status_name as uploadstatusName,
                    iu.file_url as url,
                    iu.thumbnail_url as thumbnailUrl,
                    iu.file_name as fileName,
                    iu.image_name as imageName,
                    iu.image_description as imageDescription,
                    iu.created_at as uploadedAt,
                    iu.created_by as uploadedBy
                FROM field_tracker.image_uploads iu
                JOIN field_tracker.image_submission_types ist
                    ON iu.submission_type_id = ist.id
                JOIN field_tracker.image_upload_status_types iust
                    ON iu.upload_status_id = iust.id
                WHERE iu.submission_type_id = @submissionTypeId
                AND iu.submission_location = @submissionLocation
                AND iu.submission_id = @submissionId
                AND iu.upload_status_id = @uploadStatusId
                AND iu.deleted_at IS NULL;
            `);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                if (isLocal) {
                    row.url = await generateSasUrlLocal(row.url);
                    row.thumbnailUrl = await generateSasUrlLocal(row.thumbnailUrl);
                } else {
                    row.url = await generateSasUrlDeployed(row.url);
                    row.thumbnailUrl = await generateSasUrlDeployed(row.thumbnailUrl);
                }
            }

            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(`Error retrieving image_uploads entries:`, error);
    }
}

async function getReviewImageUploads(submissionId: number, req: HttpRequest, context: Context) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);

        const result = await pool.request()
            .input('uploadStatusId', sql.Int, 2)
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.unit_tasks')
            .input('submissionTypeId', sql.Int, 4)
            .query(`
                SELECT
                    iu.id as uploadId,
                    iu.submission_type_id as submissionTypeId,
                    ist.type_name as submissionTypeName,
                    iu.submission_location as submissionLocation,
                    iu.submission_id as submissionId,
                    iu.upload_status_id as uploadStatusId,
                    iust.status_name as uploadstatusName,
                    iu.file_url as url,
                    iu.thumbnail_url as thumbnailUrl,
                    iu.file_name as fileName,
                    iu.image_name as imageName,
                    iu.image_description as imageDescription,
                    iu.created_at as uploadedAt,
                    iu.created_by as uploadedBy
                FROM field_tracker.image_uploads iu
                JOIN field_tracker.image_submission_types ist
                    ON iu.submission_type_id = ist.id
                JOIN field_tracker.image_upload_status_types iust
                    ON iu.upload_status_id = iust.id
                WHERE iu.submission_type_id = @submissionTypeId
                AND iu.submission_location = @submissionLocation
                AND iu.submission_id = @submissionId
                AND iu.upload_status_id = @uploadStatusId
                AND iu.deleted_at IS NULL;
            `);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                if (isLocal) {
                    row.url = await generateSasUrlLocal(row.url);
                    row.thumbnailUrl = await generateSasUrlLocal(row.thumbnailUrl);
                } else {
                    row.url = await generateSasUrlDeployed(row.url);
                    row.thumbnailUrl = await generateSasUrlDeployed(row.thumbnailUrl);
                }
            }

            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(`Error retrieving image_uploads entries:`, error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to fetch unit task details.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const unitTaskId = context.bindingData.unitTaskId;

    const query = `
        SELECT
            ut.id as taskId,
            ut.unit_by_scope_id as unitId,
            ut.parent_task_id as parentTaskId,
            ut.root_main_task_id as rootMainTaskId,
            rut.task_type_id as rootTaskTypeId,
            put.task_type_id as parentTaskTypeId,
            ptt.type_name as parentTaskTypeName,
            put.status_id as parentStatusId,
            ptst.status_name as parentStatusName,
            ut.task_type_id as taskTypeId,
            tt.type_name as taskTypeName,
            ut.phase_id as phaseId,
            upbs.phase_name as phaseName,
            ut.status_id as statusId,
            tst.status_name as statusName,
            ut.image_acknowledgment as imageAcknowledgmentChecked,
            upbs.image_acknowledgment_text as imageAcknowledgmentText,
            ut.assigned_worker_id as assignedWorkerId,
            u.name as assignedWorkerName,
            ut.scheduled_date as scheduledDate,
            ut.scheduled_by as scheduledById,
            ut.submitted_at as submittedAt,
            ut.submitted_by as submittedBy,
            ut.submission_notes as submissionNotes,
            ut.reviewed_at as reviewedAt,
            ut.reviewed_by as reviewedBy,
            ut.review_notes as reviewNotes,
            ut.task_details as taskDetails,
            ut.created_at as createdAt,
            ut.created_by as createdBy,
            ut.updated_at as updatedAt,
            ut.updated_by as updatedBy,
            ut.deleted_at as deletedAt,
            ut.deleted_by as deletedBy,
            su.name as secondaryWorkerName
        FROM field_tracker.unit_tasks ut
        LEFT JOIN field_tracker.unit_tasks put
            ON ut.parent_task_id = put.id
        LEFT JOIN field_tracker.task_types ptt
            ON put.task_type_id = ptt.id
        LEFT JOIN field_tracker.task_status_types ptst
            ON put.status_id = ptst.id
        JOIN field_tracker.task_types tt
            ON ut.task_type_id = tt.id
        JOIN field_tracker.unit_phases_by_scope upbs
            ON ut.phase_id = upbs.id
        JOIN field_tracker.task_status_types tst
            ON ut.status_id = tst.id
        LEFT JOIN field_tracker.workers w
            ON ut.assigned_worker_id = w.id
        LEFT    JOIN dbo.users u
            ON w.user_id = u.id
        LEFT JOIN field_tracker.unit_tasks rut
            ON ut.root_main_task_id = rut.id
        LEFT JOIN field_tracker.task_types rtt
            ON rut.task_type_id = rtt.id
        LEFT JOIN field_tracker.workers sw
            ON ut.secondary_worker_id = sw.id
        LEFT JOIN dbo.users su
            ON sw.user_id = su.id
        WHERE ut.id = @unitTaskId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('unitTaskId', sql.Int, unitTaskId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.images = await getImageUploads(row.taskId, req, context);
                row.proofImages = await getProofImageUploads(row.taskId, req, context);
                row.reviewImages = await getReviewImageUploads(row.taskId, req, context);
                row.clearInspection = await getClearInspection(row.taskId, context);
            }

            context.res = {
                body: result.recordset[0]
            };
        } else {
            context.res = {
                status: 200,
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
