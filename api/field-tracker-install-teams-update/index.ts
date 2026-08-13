import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';

import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface UpdateInstallTeamInput {
    teamName: string;
    statusId: number;
    updatedBy: number;
}

async function validateNewTeam(installTeamId: number, data: UpdateInstallTeamInput): Promise<string | null> {
    // Check for null or undefined and data types
    const validStatusType = await isValidId(data.statusId, 'field_tracker.install_teams_status_types');
    if (!validStatusType) {
        return "Invalid status type.";
    }
    const validInstallTeamId = await isValidId(installTeamId, 'field_tracker.install_teams');
    if (!validInstallTeamId) {
        return "Invalid install team.";
    }
    // All validation passed
    return null;
};

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
        // Error caught and logged, proceed to return false
    }
    return false; // Default to false if the pool is not available, an error occurs, or other conditions fail
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create a new install team.');

    const installTeamId = context.bindingData.installTeamId;

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const installTeamData = req.body as UpdateInstallTeamInput;
    const validationError = await validateNewTeam(installTeamId, installTeamData);

    if (validationError) {
        context.res = {
            status: 400,
            body: validationError
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const transaction = new sql.Transaction(pool);

    const updateQuery = `
        UPDATE field_tracker.install_teams
        SET
            team_name = @teamName,
            status_id = @statusId,
            updated_at = @updatedAt,
            updated_by = @updatedBy
        WHERE id = @installTeamId
    `;

    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        
        // Initial query to create the base dbo.projects entry
        await request
            .input('installTeamId', sql.Int, installTeamId)
            .input('teamName', sql.NVarChar(255), installTeamData.teamName)
            .input('statusId', sql.Int, installTeamData.statusId)
            .input('updatedAt', sql.DateTime, new Date())
            .input('updatedBy', sql.Int, installTeamData.updatedBy)
            .query(updateQuery);

        await transaction.commit();

        context.res = {
            status: 200,
            body: { message: `Install Team: ${installTeamData.teamName} have been created` }
        };

        return;
    } catch (error) {
        // Log the error
        context.log(`Transaction error occurred: ${(error as Error).message}`);

        // Rollback the transaction if it is in progress
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            context.log(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
        }
        
        context.res = {
            status: 500,
            body: {
                message: (error as Error).message
            }
        };

        // Log the error to the error_log table if possible
        if (pool && pool.connected) {
            try {
                await pool.request()
                    .input('errorMessage', sql.NVarChar, (error as Error).message)
                    .input('errorTime', sql.DateTime, new Date())
                    .query(`INSERT INTO dbo.error_log (error_message, error_time) VALUES (@errorMessage, @errorTime)`);
            } catch (loggingError) {
                context.log(`Error occurred while logging error to error_log: ${(loggingError as Error).message}`);
            }
        }
    }
};

export default httpTrigger;