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

async function hasSubTask(unitId: number): Promise<boolean> {
    const query = `
        SELECT
            id
        FROM field_tracker.unit_tasks
        WHERE parent_task_id= @unitId
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(query);

        if (result.recordset.length > 0) {
            return true;
        } else return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all blocking issue types.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    const projectByScopeId = context.bindingData.projectByScopeId;
    const workerId = context.bindingData.workerId;
    
    const isValidProjectByScopeId = await isValidId(projectByScopeId, "field_tracker.projects_by_scope");
    if (!isValidProjectByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid projectByScopeId."
        };
        return;
    }

    const isValidWorkerId = await isValidId(workerId, "field_tracker.workers");
    if (!isValidWorkerId) {
        context.res = {
            status: 400,
            body: "Invalid workerId."
        };
        return;
    }

    const query = `
        SELECT
            ut.id as taskId,
            ubs.unit_id as unitId,
            pr.building,
            pr.building_level as level,
            pr.unit,
            pr.area,
            pr.unit_type as unitType,
            upbs.phase_name as unitPhaseName,
            upbs.initial_cumulative_percent as progress,
            ubsst.status_name as unitStatusName,
            tt.type_name as taskTypeName,
            tst.status_name as taskStatusName,
            ut.scheduled_date as scheduledDate,
            u.name as submittedBy,
            ut.submitted_at as submissionDate,
            ut.reviewed_at as reviewedAt,
            ubs.id as unitByScopeId,
            ubs.project_by_scope_id as projectByScopeId
        FROM field_tracker.unit_tasks ut
        JOIN field_tracker.units_by_scope ubs
            ON ut.unit_by_scope_id = ubs.id
        JOIN field_tracker.project_rows pr
            ON ubs.unit_id = pr.id
        JOIN field_tracker.unit_phases_by_scope upbs
            ON ubs.current_phase_id = upbs.id
        JOIN field_tracker.unit_by_scope_status_types ubsst
            ON ubs.status_id = ubsst.id
        JOIN field_tracker.task_types tt
            ON ut.task_type_id = tt.id
        JOIN field_tracker.task_status_types tst
            ON ut.status_id = tst.id
        LEFT JOIN dbo.users u
            ON ut.submitted_by = u.id
        WHERE ut.parent_task_id IS NULL
        AND ut.assigned_worker_id = @workerId
        AND ubs.project_by_scope_id = @projectByScopeId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('workerId', sql.Int, workerId)
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.hasSubTasks = await hasSubTask(row.taskId);
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
