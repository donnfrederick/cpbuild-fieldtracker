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

async function validateSubmissionEntry(req: HttpRequest): Promise<string | null> {
    if (req.body.statusId && !await isValidId(req.body.statusId, `field_tracker.task_status_types`)) {
        return "Invalid parameter value: statusId";
    }
    
    if (req.body.assignedWorkerId > 0 && !await isValidId(req.body.assignedWorkerId, `field_tracker.workers`)) {
        return "Invalid parameter value: assignedWorkerId";
    }
    
    if (req.body.secondaryWorkerId > 0 && !await isValidId(req.body.secondaryWorkerId, `field_tracker.workers`)) {
        return "Invalid parameter value: secondaryWorkerId";
    }
    
    
    if (req.body.scheduledBy && !await isValidId(req.body.scheduledBy, `dbo.users`)) {
        return "Invalid parameter value: scheduledBy";
    }
    
    if (req.body.submittedBy && !await isValidId(req.body.submittedBy, `dbo.users`)) {
        return "Invalid parameter value: submittedBy";
    }
    
    if (req.body.reviewedBy && !await isValidId(req.body.reviewedBy, `dbo.users`)) {
        return "Invalid parameter value: reviewedBy";
    }
    
    if (req.body.updatedBy && !await isValidId(req.body.updatedBy, `dbo.users`)) {
        return "Invalid parameter value: updatedBy";
    }

    return null;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');
    context.log("req.body.assignedWorkerId", req.body.assignedWorkerId);
    context.log("req.body.secondaryWorkerId", req.body.secondaryWorkerId);

    const unitTaskId = context.bindingData.unitTaskId;

    const validationError = await validateSubmissionEntry(req);
    if (validationError) {
        context.res = { 
            tatus: 400,
            body: validationError
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    let updateQuery = `
        UPDATE field_tracker.unit_tasks
        SET
            status_id = @status_id,
            updated_at = @updated_at,
            updated_by = @updated_by, 
            scheduled_date = @scheduled_date
    `;

    if (req.body.assignedWorkerId >= 0) {
        updateQuery += ", assigned_worker_id = @assigned_worker_id";
    }

    if (req.body.secondaryWorkerId >= 0) {
        updateQuery += ", secondary_worker_id = @secondary_worker_id";
    }

    if (req.body.scheduledBy != null) {
        updateQuery += ", scheduled_by = @scheduled_by";
    }

    if (req.body.submittedAt != null) {
        updateQuery += ", submitted_at = @submitted_at";
    }

    if (req.body.submittedBy != null) {
        updateQuery += ", submitted_by = @submitted_by";
    }

    if (req.body.submissionNotes != null) {
        updateQuery += ", submission_notes = @submission_notes";
    }

    if (req.body.reviewedAt != null) {
        updateQuery += ", reviewed_at = @reviewed_at";
    }

    if (req.body.reviewedBy != null) {
        updateQuery += ", reviewed_by = @reviewed_by";
    }

    if (req.body.reviewNotes != null) {
        updateQuery += ", review_notes = @review_notes";
    }

    if (req.body.taskDetails != null) {
        updateQuery += ", task_details = @task_details";
    }

    if (req.body.imageAcknowledgement != null) {
        updateQuery += ", image_acknowledgment = @image_acknowledgment";
    }

    updateQuery += " WHERE id = @unitTaskId;";

    try {
        await transaction.begin();
        const request = pool.request();

        // Convert incoming scheduledDate properly
        let scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null;

        // Handle potential invalid date conversion
        if (scheduledDate && isNaN(scheduledDate.getTime())) {
            scheduledDate = null;
        }

        // If valid date, set time to 23:59:59.999 to avoid timezone shifts
        if (scheduledDate) {
            scheduledDate.setHours(23, 59, 59, 999);
        }


        request
            .input('unitTaskId', sql.Int, unitTaskId)
            .input('status_id', sql.Int, req.body.statusId)
            .input('scheduled_date', sql.DateTime, scheduledDate);

        if (req.body.assignedWorkerId >= 0) {
            let workerId;
            if (req.body.assignedWorkerId == 0) {
                workerId = null;
            } else workerId = req.body.assignedWorkerId;
            request.input('assigned_worker_id', sql.Int, workerId);
        }

        if (req.body.secondaryWorkerId >= 0) {
            let secondaryWorkerId;
            if (req.body.secondaryWorkerId == 0) {
                secondaryWorkerId = null;
            } else secondaryWorkerId = req.body.secondaryWorkerId;
            request.input('secondary_worker_id', sql.Int, secondaryWorkerId);
        }
        
        if (req.body.scheduledBy) {
            request.input('scheduled_by', sql.Int, req.body.scheduledBy);
        }
    
        if (req.body.submittedAt) {
            request.input('submitted_at', sql.DateTime, req.body.submittedAt);
        }
    
        if (req.body.submittedBy) {
            request.input('submitted_by', sql.Int, req.body.submittedBy);
        }
    
        if (req.body.submissionNotes != null) {
            request.input('submission_notes', sql.NVarChar, req.body.submissionNotes);
        }
    
        if (req.body.reviewedAt) {
            request.input('reviewed_at', sql.DateTime, req.body.reviewedAt);
        }
    
        if (req.body.reviewedBy) {
            request.input('reviewed_by', sql.Int, req.body.reviewedBy);
        }
    
        if (req.body.reviewNotes) {
            request.input('review_notes', sql.NVarChar, req.body.reviewNotes);
        }
    
        if (req.body.taskDetails) {
            request.input('task_details', sql.NVarChar, req.body.taskDetails);
        }
    
        if (req.body.imageAcknowledgement != null) {
            request.input('image_acknowledgment', sql.Int, req.body.imageAcknowledgement);
        }
        context.log('updateQuery:', updateQuery);
        await request
            .input('updated_at', sql.DateTime, new Date())
            .input('updated_by', sql.Int, req.body.updatedBy)
            .query(updateQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: {
                message: `Successfully Updated`
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
