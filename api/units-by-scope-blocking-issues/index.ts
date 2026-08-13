import { Context } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { generateSasUrlLocal, generateSasUrlDeployed } from "../services/azureBlobStorageService";

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const isLocal = process.env.IsLocal === "true";

async function resolutionImages(submissionId: number, context: Context) {
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
        AND submission_type_id = @submissionTypeId
        AND upload_status_id = 2;
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.blocking_issues')
            .input('submissionTypeId', sql.Int, 6)
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

async function issueImages(submissionId: number, context: Context) {
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
        AND submission_type_id = @submissionTypeId
        AND upload_status_id = 2;
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('submissionId', sql.Int, submissionId)
            .input('submissionLocation', sql.NVarChar, 'field_tracker.blocking_issues')
            .input('submissionTypeId', sql.Int, 5)
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

export default async function blockingIssues(unitId: number, context: Context) {
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
            bi.issue_type_id as issueTypeId,
            bit.type_name as issueTypeName,
            bi.responsible_party_id as responsiblePartyTypeId,
            birpt.type_name as responsiblePartyTypeName
        FROM field_tracker.blocking_issues bi
        JOIN field_tracker.blocking_issue_status_types bist ON bi.status_id = bist.id
        JOIN field_tracker.blocking_issue_types bit ON bi.issue_type_id = bit.id
        JOIN field_tracker.blocking_issue_responsible_party_types birpt ON bi.responsible_party_id = birpt.id
        WHERE bi.unit_id = @unitId
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.images = await issueImages(row.id, context);
                row.resolutionImages = await resolutionImages(row.id, context);
            }

            return result.recordset;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}