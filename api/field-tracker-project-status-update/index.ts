    import { AzureFunction, Context, HttpRequest } from "@azure/functions";
    import * as sql from 'mssql';

    import { baseConfig } from '../dbConfig';
    import { initializePool } from '../services/dbService';

    type StatusIdMap = {
        [key: string]: number;
    };

    // Define SQL Server connection options
    const sqlConfig: sql.config = baseConfig.toolsDashboard;
    const databaseIdentifier = baseConfig.toolsDashboard.database;

    const validTableNames = new Set(['field_tracker.projects']);
    const validStatusValues = new Set(['active', 'completed', 'deleted']);

    function isValidTableName(tableName: string) {
        return validTableNames.has(tableName);
    }

    async function isValidId(id: number, tableName: string, context: any): Promise<any> {
        if (!isValidTableName(tableName)) {
            console.error(`Invalid table name: ${tableName}`);
            return { isValid: false, debugInfo: `Invalid table name: ${tableName}` };
        }

        if (id <= 0) {
            return { isValid: false, debugInfo: 'ID is zero or negative' };
        }

        try {
            const pool = await initializePool(databaseIdentifier, sqlConfig);

            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);

            return { isValid: result.recordset[0].count > 0, debugInfo: `Queried ID: ${id}, Count: ${result.recordset[0].count}` };
        } catch (error) {
            console.error(`Error checking valid ID in table ${tableName}:`, error);
            return { isValid: false, debugInfo: `Error: ${(error as Error).message}` };
        }
    };


    const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
        context.log('HTTP trigger function processed a request to update field tracker project status.');

        const statusIdMap: StatusIdMap = {
            active: 1,
            completed: 2,
            deleted: 3
        };

        const ftProjectId = context.bindingData.ftProjectId;
        const newStatus = context.bindingData.statusValue;

        const validProject = await isValidId(ftProjectId, 'field_tracker.projects', context);
        context.log('validation.debugInfo is set to:', validProject.debugInfo);

        if (!validProject.isValid) {
            context.res = {
                status: 400,
                body: `Invalid Field Tracker Project ID: ${ftProjectId}`
            };
            return;
        }

        if (!validStatusValues.has(newStatus)) {
            context.res = {
                status: 400,
                body: `Invalid status value: ${newStatus}`
            };
            return;
        }

        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const statusId = statusIdMap[newStatus];

            const checkStatusQuery = `
                SELECT project_status_id
                FROM field_tracker.projects
                WHERE id = @projectId
            `;

            const requestForCurrentStatus = new sql.Request(transaction);
            requestForCurrentStatus.input('projectId', sql.Int, ftProjectId);
            const currentStatusResult = await requestForCurrentStatus.query(checkStatusQuery);

            // Proceed with update only if current status differs from new status
            if (currentStatusResult.recordset[0].project_status_id !== statusId) {
                const requestForUpdate = new sql.Request(transaction);
                requestForUpdate.input('projectId', sql.Int, ftProjectId);
                requestForUpdate.input('statusId', sql.Int, statusId);

                // Update project status if it's different from the current status
                const updateStatusQuery = `
                    UPDATE field_tracker.projects
                    SET project_status_id = @statusId
                    WHERE id = @projectId
                    AND project_status_id <> @statusId
                `;
                await requestForUpdate.query(updateStatusQuery);

                await transaction.commit();

                context.res = {
                    status: 200,
                    body: `Project status updated successfully to ${newStatus}.`,
                };
            } else {
                // No update needed, status is already set to the new status
                context.res = {
                    status: 200,
                    body: `No update required. Project is already set to the status '${newStatus}'.`,
                };
            }
        } catch (error) {
            if (transaction) {
                await transaction.rollback();
            }
            context.res = {
                status: 500,
                body: `An error occurred while updating the project status: ${(error as Error).message}`,
            };
        }
    };

    export default httpTrigger;