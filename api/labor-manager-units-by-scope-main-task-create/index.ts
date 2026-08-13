import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import fetchMainTasks from "../labor-manager-unit-main-tasks-get/fetchMainTasks";
import fetchSubTasks from "../labor-manager-unit-sub-tasks-get/fetchSubTasks";

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

async function retrieveScopeTypeId(unitByScopeId: number) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('id', sql.Int, unitByScopeId)
            .query(`
                SELECT
                    pbs.scope_type_id as scopeTypeId
                FROM field_tracker.projects_by_scope pbs
                JOIN field_tracker.units_by_scope ubs
                    ON ubs.project_by_scope_id = pbs.id
                WHERE ubs.id = @id
            `);
        
        if (result.recordset.length > 0) {
            return result.recordset[0].scopeTypeId;
        } else return null;
    } catch (error) {
        console.error(`Error retrieving scopeTypeId:`, error);
    }
}

async function fetchPhaseIds(scopeTypeId: number) {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(`
                SELECT id
                FROM field_tracker.unit_phases_by_scope
                WHERE main_task_required = 1
                AND scope_type_id = @scopeTypeId
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

async function checkUnitTaskExistence(phaseId: number, unitByScopeId: number): Promise<boolean> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('unitByScopeId', sql.Int, unitByScopeId)
            .input('phaseId', sql.Int, phaseId)
            .query(`
                SELECT id
                FROM field_tracker.unit_tasks
                WHERE unit_by_scope_id = @unitByScopeId
                AND phase_id = @phaseId
            `);
        return result.recordset.length > 0;
    } catch (error) {
        console.error(`Error checking unit_tasks existence:`, error);
    }

    return false;
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

async function createChecklistItem(taskId: number, phaseId: number, createdBy: number) {
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

async function lockProjectRowFromUnitByScope(unitByScopeId: number, context: Context) {
    const pool = await initializePool(databaseIdentifier, sqlConfig);

    try {
        //Get unitId from units_by_scope
        const getUnitIdQuery = `
            SELECT unit_id AS unitId
            FROM field_tracker.units_by_scope
            WHERE id = @unitByScopeId
        `;
        const getUnitRequest = pool.request();
        const unitResult = await getUnitRequest
            .input('unitByScopeId', sql.Int, unitByScopeId)
            .query(getUnitIdQuery);

        const unitId = unitResult.recordset[0]?.unitId;
        if (!unitId) {
            console.warn(`No unitId found for unitByScopeId: ${unitByScopeId}`);
            return;
        }

        context.log(`Retrieved unitId: ${unitId} for unitByScopeId: ${unitByScopeId}`);
    } catch (error) {
        console.error('Error in lockProjectRowFromUnitByScope:', error);
    }
}

async function isClearInspectionPhase(phaseId: number):Promise<boolean> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('phaseId', sql.Int, phaseId)
            .query(`
                SELECT phase_name
                FROM field_tracker.unit_phases_by_scope
                WHERE id = @phaseId
            `);
        
        if (result.recordset[0].phase_name == 'Clear Inspection') return true;
        else return false;
    } catch (error) {
        console.error(`Error checking if clear inspection phase:`, error);
    }

    return false;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const unitByScopeId = context.bindingData.unitByScopeId;

    const isValidUnitByScopeId = await isValidId(unitByScopeId, "field_tracker.units_by_scope");
    if (!isValidUnitByScopeId) {
        context.res = {
            status: 400,
            body: "Invalid unitByScopeId."
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const insertQuery = `
        INSERT INTO field_tracker.unit_tasks (unit_by_scope_id, task_type_id, phase_id, status_id, created_at, created_by)
        OUTPUT INSERTED.id
        VALUES (@unitByScopeId, @taskTypeId, @phaseId, @statusId, @createdAt, @createdBy);
    `;

    try {
        const scopeTypeId = await retrieveScopeTypeId(unitByScopeId);
        const phaseIds = await fetchPhaseIds(scopeTypeId);
        let tasks = {
            mainTasks: [] as any,
        }

        let entriesCount: number = 0;

        if (phaseIds != null) {
            for (const phaseId of phaseIds) {
                if (!await checkUnitTaskExistence(phaseId, unitByScopeId)) {
                    await transaction.begin();
                    const request = pool.request();

                    let statusId: number;

                    if (await isClearInspectionPhase(phaseId)) statusId = 2
                    else statusId = 1;

                    const insertResult = await request
                        .input('unitByScopeId', sql.Int, unitByScopeId)
                        .input('taskTypeId', sql.Int, 1)
                        .input('phaseId', sql.Int, phaseId)
                        .input('statusId', sql.Int, statusId)
                        .input('createdAt', sql.DateTime, new Date())
                        .input('createdBy', sql.Int, req.body.createdBy)
                        .query(insertQuery);

                    await transaction.commit();

                    await createChecklistItem(insertResult.recordset[0].id, phaseId, req.body.createdBy);
                    await lockProjectRowFromUnitByScope(unitByScopeId, context);
                    entriesCount = entriesCount + 1;
                }
            }

            tasks.mainTasks = await fetchMainTasks(unitByScopeId, context);
        }

        context.res = {
            status: 200,
            body: {
                tasks,
                message: `All main task have been added to unit_tasks table`,
                entriesCount
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
