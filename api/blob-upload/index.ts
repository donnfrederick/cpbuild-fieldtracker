import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { uploadFileToBlob } from "../services/azureBlobStorageService";
import parseMultipartFormData from "@anzp/azure-function-multipart";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface SubmissionEntry {
    submissionTypeId: number;
    submissionLocation: string;
    submissionId: number;
    sessionId: string;
    uploadStatusId: number;
    fileUrl: string;
    thumbnailUrl: string;
    fileName: string;
    imageName: string;
    imageDescription: string;
    createdBy: number;
}

async function tableExits(tableName: string): Promise<boolean> {
    try {
      const pool = await initializePool(databaseIdentifier, sqlConfig);
      const checkTableQuery = `
        SELECT COUNT(*) AS tableExists
        FROM information_schema.tables
        WHERE table_name = @tableName
      `;

      const result = await pool.request()
        .input('tableName', sql.NVarChar, tableName)
        .query(checkTableQuery);

      return result.recordset[0].tableExists > 0;
    } catch (error) {
      console.error(`Error checking if table "${tableName}" exists:`, error);
      return false;
    }
  }

  async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (id <= 0) {
      return false;
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
    return false;
  }

  async function validateSubmissionEntry(data: SubmissionEntry): Promise<string | null> {
    if (!await isValidId(data.submissionTypeId, 'field_tracker.image_submission_types')) {
      return "Invalid parameter value: submissionTypeId";
    }

    if (!await isValidId(data.uploadStatusId, 'field_tracker.image_upload_status_types')) {
      return "Invalid parameter: uploadStatusId";
    }

    if (!await isValidId(data.createdBy, 'dbo.users')) {
      return "Invalid parameter: createdBy";
    }

    // Notice `tableExits` is missing an `await` in your original code.
    // If you intended to wait for it, consider: `if (!(await tableExits(...)) || !await isValidId(...)) {...}`
    if (data.submissionId > 0) {
      if (!tableExits(data.submissionLocation) || !await isValidId(data.submissionId, data.submissionLocation)) {
        return "Invalid parameter: submissionId or submissionLocation";
      }
    }

    return null;
  }

  const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    // 0. Begin logging
    context.log('==== Starting blob-upload function ====');

    // 1. Initialize SQL connection
    context.log(`Initializing connection pool for database: ${databaseIdentifier}...`);
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    context.log('Connection pool initialized. Creating SQL transaction...');
    const transaction = new sql.Transaction(pool);

    try {
      // 2. Verify rawBody
      if (!req.rawBody) {
        context.log.warn('No rawBody found in the request. Returning 400...');
        context.res = { status: 400, body: "Request body is missing." };
        return;
      }

      // 3. Parse the multipart/form-data
      context.log('Parsing multipart form data...');
      const { fields, files } = await parseMultipartFormData(req);
      context.log(`Parsed fields: [${fields.map(f => f.name).join(', ')}]`);
      context.log(`Parsed files: [${files.map(f => f.filename).join(', ')}]`);

      // Ensure we have at least one file
      if (!files.length) {
        context.log.warn('No files in request. Returning 400...');
        context.res = { status: 400, body: "No file was provided in the request." };
        return;
      }

      // 4. Build the submissionEntry object
      context.log('Building submissionEntry object...');
      const submissionEntry: SubmissionEntry = {
        submissionTypeId: fields.find(field => field.name === 'submissionTypeId')?.value,
        submissionLocation: fields.find(field => field.name === 'submissionLocation')?.value,
        submissionId: fields.find(field => field.name === 'submissionId')?.value,
        sessionId: atob(fields.find(field => field.name === 'sessionId')?.value),
        uploadStatusId: 2,
        fileUrl: "",
        thumbnailUrl: "",
        fileName: files[0].filename,
        imageName: fields.find(field => field.name === 'imageName')?.value,
        imageDescription: fields.find(field => field.name === 'imageDescription')?.value,
        createdBy: fields.find(field => field.name === 'createdBy')?.value
      };
      context.log('submissionEntry object:', JSON.stringify(submissionEntry, null, 2));

      // 5. Validate submission entry
      context.log('Validating submissionEntry...');
      const validationError = await validateSubmissionEntry(submissionEntry);
      if (validationError) {
        context.log.warn(`Validation failed: ${validationError}`);
        context.res = { status: 400, body: validationError };
        return;
      }
      context.log('submissionEntry passed validation.');

      // 6. Upload the file to Blob Storage
      const uploadRequest = await uploadFileToBlob(
        context,
        files[0].filename,
        files[0].bufferFile,
        process.env.BlobContainerName || ''
      );

      if (uploadRequest.error == null) {
        context.log(`Blob upload successful. File URL: ${uploadRequest.data.fileUrl}`);

        // 7. Update submissionEntry with new URLs
        submissionEntry.fileUrl = uploadRequest.data.fileUrl;
        submissionEntry.thumbnailUrl = uploadRequest.data.thumbnailUrl;

        // 8. Insert into SQL
        context.log('Beginning SQL transaction...');
        await transaction.begin();
        context.log('Transaction begun. Executing insert query...');

        const insertQuery = `
          INSERT INTO field_tracker.image_uploads (
            submission_type_id,
            submission_location,
            submission_id,
            session_id,
            upload_status_id,
            file_url,
            thumbnail_url,
            file_name,
            image_name,
            image_description,
            created_by
          )
          OUTPUT INSERTED.id
          VALUES (
            @submissionTypeId,
            @submissionLocation,
            @submissionId,
            @sessionId,
            @uploadStatusId,
            @fileUrl,
            @thumbnailUrl,
            @fileName,
            @imageName,
            @imageDescription,
            @createdBy
          );
        `;

        const request = new sql.Request(transaction);
        await request
          .input('submissionTypeId', sql.Int, submissionEntry.submissionTypeId)
          .input('submissionLocation', sql.NVarChar, submissionEntry.submissionLocation)
          .input('submissionId', sql.Int, submissionEntry.submissionId)
          .input('sessionId', sql.NVarChar, submissionEntry.sessionId)
          .input('uploadStatusId', sql.Int, submissionEntry.uploadStatusId)
          .input('fileUrl', sql.NVarChar, submissionEntry.fileUrl)
          .input('thumbnailUrl', sql.NVarChar, submissionEntry.thumbnailUrl)
          .input('fileName', sql.NVarChar, submissionEntry.fileName)
          .input('imageName', sql.NVarChar, submissionEntry.imageName)
          .input('imageDescription', sql.NVarChar, submissionEntry.imageDescription)
          .input('createdBy', sql.Int, submissionEntry.createdBy)
          .query(insertQuery);

        context.log('SQL insert query succeeded. Committing transaction...');
        await transaction.commit();
        context.log('Transaction committed successfully.');

        // 9. Return success response
        context.log('Returning success response with file info...');
        context.res = {
          status: 200,
          body: {
            message: "File uploaded successfully",
            result: {
              fileUrl: uploadRequest.data.fileUrl,
              thumbnailUrl: uploadRequest.data.thumbnailUrl
            }
          }
        };
      } else {
        // 10. Blob upload returned an error
        context.log.error('Blob upload returned an error object:', uploadRequest.data);
        context.res = {
          status: 500,
          body: "Internal Server Error: " + uploadRequest.message
        };
      }
    } catch (error) {
      // 11. Handle unexpected errors
      context.log.error('Caught exception in blob-upload function:', error);

      // Attempt to rollback if transaction started
      try {
        context.log('Attempting to rollback transaction...');
        await transaction.rollback();
        context.log('Transaction rolled back successfully.');
      } catch (rollbackError) {
        context.log.error(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
      }

      // Return 500
      context.res = {
        status: 500,
        body: "Internal Server Error: " + (error as Error).message
      };
    }
  };

  export default httpTrigger;
