import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

interface ProjectInput {
    rootProjectId: number;
    projectStatusId: number;
    userId?: number;
};

async function validateProjectInput(data: ProjectInput): Promise<string | null> {
    // Check for null or undefined inputs and data types
    if (!data.rootProjectId || typeof data.rootProjectId !== 'number') {
        return 'project ID is required and must be a number.';
    }

    if (!data.projectStatusId || typeof data.projectStatusId !== 'number') {
        return 'project status ID is required and must be a number.';
    }

    if (data.userId && typeof data.userId !== 'number') {
        return 'user ID must be a number.';
    }

    // Validate IDs against the database
    if (!await isValidId(data.rootProjectId, 'dbo.projects')) {
        return `Invalid project ID: ${data.rootProjectId}`;
    }

    if (!await isValidId(data.projectStatusId, 'field_tracker.project_status_types')) {
        return `Invalid project status ID: ${data.projectStatusId}`;
    }

    if (data.userId && !await isValidId(data.userId, 'dbo.users')) {
        return `Invalid user ID: ${data.userId}`;
    }

    // All validation passed
    return null;
}

const validTableNames = new Set(['dbo.projects', 'field_tracker.project_status_types', 'dbo.users']);

function isValidTableName(tableName: string) {
    return validTableNames.has(tableName);
}

async function isValidId(id: number, tableName: string): Promise<boolean> {
    if (!isValidTableName(tableName)) {
        console.error(`Invalid table name: ${tableName}`);
        return false;
    }

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
    context.log('HTTP trigger function processed a request to create new Field Tracker Project entry.');

    // Validate request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing or contains invalid data."
        };
        return;
    }

    const projectData = req.body as ProjectInput;
    const validationError = await validateProjectInput(projectData);

    if (validationError) {
        context.res = {
            status: 400,
            body: validationError
        };
        return;
    }

    // Dynamically build the query based on if the user ID is provided
    let insertQuery = `
        INSERT INTO field_tracker.projects (project_id, project_status_id`;

    if (projectData.userId) {
        insertQuery += `, created_by`;
    }

    insertQuery += `)
        OUTPUT INSERTED.id
        VALUES (@rootProjectId, @projectStatusId`;

    if (projectData.userId) {
        insertQuery += `, @createdBy`;
    }

    insertQuery += `);`;

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    try {
        if (pool) {
            const transaction = new sql.Transaction(pool);
            try {
                await transaction.begin();
                const request = new sql.Request(transaction);

                request.input('rootProjectId', sql.Int, projectData.rootProjectId)
                    .input('projectStatusId', sql.Int, projectData.projectStatusId);

                if (projectData.userId) {
                    request.input('createdBy', sql.Int, projectData.userId);
                };

                const insertResult = await request.query(insertQuery);

                if (insertResult.recordset.length === 0) {
                    throw new Error('No rows were inserted');
                }

                const newFieldTrackerProjectId = insertResult.recordset[0].id;
                await transaction.commit();
                context.res = {
                    status: 201,
                    body: { fieldTrackerProjectId: newFieldTrackerProjectId }
                };
            } catch (error) {
                // Log the error
                context.log(`Transaction error occurred: ${(error as Error).message}`);

                // Rollback the transaction if it is in progress
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    context.log(`Error occurred during transaction rollback: ${(rollbackError as Error).message}`);
                }

                // Set the response depending on the type of error
                context.res = {
                    status: error instanceof sql.RequestError && error.code === 'EREQUEST' ? 400 : 500,
                    body: error instanceof sql.RequestError && error.code === 'EREQUEST' ?
                        ( error.message.includes('UNIQUE KEY constraint') ?
                            "That Tools Dashboard project ID is already linked to another Field Tracker project." :
                            "An error occurred while processing your request." ) :
                        "An internal server error occurred."
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
        }
    } catch (error) {
        // Log the error
        context.log(`Error occurred: ${(error as Error).message}`);

        // Set the response for the error
        context.res = {
            status: 500,
            body: `An error occurred while attempting to create the Field Tracker project: ${(error as Error).message}`
        };

        // Attempt to log the error to the error_log table
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