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

async function extractParentPhaseId(parentTaskId: number) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('parentTaskId', sql.Int, parentTaskId)
            .query(`SELECT
                ut.phase_id,
                upbs.phase_name
                FROM field_tracker.unit_tasks ut
                LEFT JOIN field_tracker.unit_phases_by_scope upbs
                ON ut.phase_id = upbs.id
                WHERE ut.id = @parentTaskID`);
        return result.recordset[0];
    } catch (error) {
        console.error(`Error extracting parent phase ID:`, error);
    }
}

async function fetchItemTypeIds(phaseId: number) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('phaseId', sql.Int, phaseId)
            .query(`
                SELECT id
                FROM field_tracker.clear_inspection_checklist_item_types
                WHERE phase_id = @phaseId
            `);
            
        if (result.recordset.length > 0) {
            const resultArr: number[] = [];

            result.recordset.forEach((row: any) => {
                resultArr.push(row.id);
            });

            return resultArr;
        } else return null;
    } catch (error) {
        console.error(`Error fetching phaseIds:`, error);
    }
}

async function createChecklistItem(taskId: number, phaseId: number, createdBy: number, context: Context) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.clear_inspection_checklist_items (task_id, item_type_id, created_at, created_by)
        VALUES (@taskId, @itemTypeId, @createdAt, @createdBy);
    `;

    try {
        const itemTypeIds = await fetchItemTypeIds(phaseId);
        
        if (itemTypeIds != null) {
            for (const itemTypeId of itemTypeIds) {
                await transaction.begin();
                const request = pool.request();
    
                await request
                    .input('taskId', sql.Int, taskId)
                    .input('itemTypeId', sql.Int, itemTypeId)
                    .input('createdAt', sql.DateTime, new Date())
                    .input('createdBy', sql.Int, createdBy)
                    .query(insertQuery);
    
                await transaction.commit();
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const parentTaskId = context.bindingData.parentTaskId;

    const createChecklistItems = req.query["create-checklist"] === "true";

    const isValidUnitByScopeId = await isValidId(req.body.unitByScopeId, "field_tracker.units_by_scope");
    if (!isValidUnitByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid unitByScopeId vlaue."
        };
        return;
    }

    const rootMainTaskId = req.body.rootMainTaskId;
    if(rootMainTaskId != null){
        const isValidRootMainTaskId = await isValidId(rootMainTaskId, "field_tracker.unit_tasks");
        if (!isValidRootMainTaskId) {
            context.res = {
                status: 400,
                body: "Invalid rootMainTaskId vlaue."
            };
            return;
        }
    }

    const isValidParentTaskId = await isValidId(parentTaskId, "field_tracker.unit_tasks");
    if (!isValidParentTaskId) {
        context.res = {
            status: 400,
            body: "Invalid parentTaskId value."
        };
        return;
    }

    if (req.body.assignedWorkerId > 0) {
        const isValidAssignedWorkerId = await isValidId(req.body.assignedWorkerId, "field_tracker.workers");
        if (!isValidAssignedWorkerId) {
            context.res = {
                status: 400,
                body: "Invalid assignedWorkerId value."
            };
            return;
        }
    }

    const isValidStatusId = await isValidId(req.body.statusId, "field_tracker.task_status_types");
    if (!isValidStatusId) {
        context.res = {
            status: 400,
            body: "Invalid statusId value."
        };
        return;
    }

    const isValidCreatedBy = await isValidId(req.body.createdBy, "dbo.users");
    if (!isValidCreatedBy) {
        context.res = {
            status: 400,
            body: "Invalid createdBy value."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.unit_tasks (unit_by_scope_id, parent_task_id, task_type_id, phase_id, status_id, assigned_worker_id, task_details, created_at, created_by, root_main_task_id)
        OUTPUT INSERTED.id
        VALUES (@unitByScopeId, @parentTaskId, @taskTypeId, @phaseId, @statusId, @assignedWorkerId, @taskDetails, @createdAt, @createdBy, @rootMainTaskId);
    `;

    try {
        await transaction.begin();
        const request = pool.request();

        const parentPhase = await extractParentPhaseId(parentTaskId);

        const insertResult = await request
            .input('unitByScopeId', sql.Int, req.body.unitByScopeId)
            .input('parentTaskId', sql.Int, parentTaskId)
            .input('taskTypeId', sql.Int, 4)
            .input('phaseId', sql.Int, parentPhase.phase_id)
            .input('statusId', sql.Int, req.body.statusId)
            .input('assignedWorkerId', sql.Int, req.body.assignedWorkerId > 0 ? req.body.assignedWorkerId : null)
            .input('taskDetails', sql.NVarChar, req.body.taskDetails)
            .input('createdAt', sql.DateTime, new Date())
            .input('createdBy', sql.Int, req.body.createdBy)
            .input('rootMainTaskId', sql.Int, rootMainTaskId)
            .query(insertQuery);

        await transaction.commit();

        if (parentPhase.phase_name == "Clear Inspection" || createChecklistItems) {
            await createChecklistItem(
                insertResult.recordset[0].id,
                parentPhase.phase_id,
                req.body.createdBy,
                context
            );
        }

        context.res = {
            status: 200,
            body: {
                submissionId: insertResult.recordset[0].id,
                message: `New unit_tasks table entry have been created `
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
