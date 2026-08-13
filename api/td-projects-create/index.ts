import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { isValidDate } from '../services/validationService';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
let pool: sql.ConnectionPool | null = null;
let initializingPool = false; // Flag to indicate if teh pool is being initialized already

interface ProjectInput {
    projectName: string;
    salesforceId: string | null;
    siteLocStreetAddress: string;
    siteLocCity: string;
    siteLocPostalCode: string;
    expectedStartDate: Date | string;
    projectStatusId: number;
    projectManagerId: number;
    installManagerId: number;
    stateId: number;
};

async function validateProjectInput(data: ProjectInput): Promise<string | null> {
    // Check for null or undefined and data types
    if (!data.projectName || typeof data.projectName !== "string" || data.projectName.length > 100) {
        return "Project name is required and must be a string less than 100 characters.";
    }

    if (data.salesforceId && typeof data.salesforceId !== "string") {
        return "Salesforce ID must be a string.";
    }

    if (!data.siteLocStreetAddress || typeof data.siteLocStreetAddress !== "string") {
        return "Street address is required and must be a string.";
    }
    
    if (!data.siteLocCity || typeof data.siteLocCity !== "string") {
        return "City is required and must be a string.";
    }
    
    if (!data.siteLocPostalCode || typeof data.siteLocPostalCode !== "string") {
        return "Postal code is required and must be a string.";
    }

    if (data.expectedStartDate && !isValidDate(data.expectedStartDate)) {
        return "Starting Date must be a valid date.";
    }

    if (data.projectStatusId === null || data.projectStatusId === undefined || typeof data.projectStatusId !== "number") {
        return "Project status ID is required and must be a number.";
    }

    if (data.projectManagerId === null || data.projectManagerId === undefined ||typeof data.projectManagerId !== "number") {
        return "Project manager ID is required and must be a number.";
    }

    if (data.installManagerId === null || data.installManagerId === undefined || typeof data.installManagerId !== "number") {
        return "Install manager ID is required and must be a number.";
    }

    if (data.stateId === null || data.stateId === undefined || typeof data.stateId !== "number") {
        return "State ID is required and must be a number.";
    }

    // Validate IDs against the database
    const validStatus = await isValidId(data.projectStatusId, 'dbo.project_status_types');
    if (!validStatus) {
        return "Invalid projectStatusId.";
    }

    const validState = await isValidId(data.stateId, 'dbo.states');
    if (!validState) {
        return "Invalid stateId.";
    }

    const validProjectManager = await isValidId(data.projectManagerId, 'dbo.users');
    if (!validProjectManager) {
        return "Invalid projectManagerId.";
    }

    const validInstallManager = await isValidId(data.installManagerId, 'dbo.users');
    if (!validInstallManager) {
        return "Invalid installManagerId.";
    }

    // All validation passed
    return null;
};

const validTableNames = new Set(['dbo.project_status_types', 'dbo.states', 'dbo.users']);

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
        await initializePool();
        if (pool) {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT COUNT(1) AS count FROM ${tableName} WHERE id = @id`);
            return result.recordset[0].count > 0;
        }
    } catch (error) {
        console.error(`Error checking valid ID in table ${tableName}:`, error);
    }
    return false; // Default to false if the pool is not available or an error occurs
};

// Initialize connection pool if it doesn't exist
async function initializePool() {
    if (pool !== null) {
        return pool; // Pool is already initialized
    }

    if (initializingPool) {
        // Pool initialization is in progress, so wait until it's not
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (!initializingPool) {
                    clearInterval(checkInterval);
                    resolve(pool);
                }
            }, 100); // Check every 100ms
        });
    } else {
        initializingPool = true; // Set the flag to indicate initialization has started
        try {
            pool = new sql.ConnectionPool(sqlConfig);
            await pool.connect();
        } catch (error) {
            console.error(`Failed to connect to SQL: ${(error as Error).message}`);
            pool = null; // Ensure the pool is set to null if initialization fails
        } finally {
            initializingPool = false; // Reset the flag after initialization
        }
    }
    return pool;
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to create a new TD base project entry.');

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

    const insertQuery = `
        INSERT INTO dbo.projects (project_name, salesforce_project_id, street_address, city, postal_code, expected_start_date, project_status_id, project_manager_id, install_manager_id, state_id)
        OUTPUT INSERTED.id
        VALUES (@projectName, @salesforceId, @siteLocStreetAddress, @siteLocCity, @siteLocPostalCode, @expectedStartDate, @projectStatusId, @projectManagerId, @installManagerId, @stateId);
    `;

    try {
        await initializePool();
        if (pool) {
            const transaction = new sql.Transaction(pool);
            try {
                await transaction.begin();
                const request = new sql.Request(transaction);
                const insertResult = await request
                    .input('projectName', sql.NVarChar(100), projectData.projectName)
                    .input('salesforceId', sql.NVarChar(100), projectData.salesforceId)
                    .input('siteLocStreetAddress', sql.NVarChar(255), projectData.siteLocStreetAddress)
                    .input('siteLocCity', sql.NVarChar(100), projectData.siteLocCity)
                    .input('siteLocPostalCode', sql.NVarChar(20), projectData.siteLocPostalCode)
                    .input('expectedStartDate', sql.DateTime, projectData.expectedStartDate)
                    .input('projectStatusId', sql.Int, projectData.projectStatusId)
                    .input('projectManagerId', sql.Int, projectData.projectManagerId)
                    .input('installManagerId', sql.Int, projectData.installManagerId)
                    .input('stateId', sql.Int, projectData.stateId)
                    .query(insertQuery);

                if (insertResult.recordset.length === 0) {
                    throw new Error('No rows were inserted');
                }

                const newProjectId = insertResult.recordset[0].id;
                await transaction.commit();
                context.res = {
                    status: 201,
                    body: { projectId: newProjectId }
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
                    body: error instanceof sql.RequestError && error.code === 'EREQUEST'
                        ? (
                            error.message.includes('UNIQUE KEY constraint') ?
                                (
                                    error.message.includes('UQ__projects') ? "A project with the same name already exists." :
                                    error.message.includes('salesforce_project_id') ? "A project with the same Salesforce ID already exists." :
                                    "An error occurred while processing your request."
                                )
                                : "An error occurred while processing your request."
                        )
                        : "An internal server error occurred."
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
            body: `An error occurred while attempting to create the project: ${(error as Error).message}`
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
