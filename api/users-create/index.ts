import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
let pool: sql.ConnectionPool | null = null;

interface UserInput {
    fullName: string;
    email: string;
    azureAdId: string;
};

const validateInput = (data: UserInput): string | null => {
    if (typeof data.fullName !== "string" || typeof data.azureAdId !== "string" || typeof data.email !== "string") {
        return "Full name, Azure AD ID, and email must be strings.";
    }

    if (!data.fullName || !data.azureAdId || !data.email) {
        return "Full name, Azure AD ID, and email are required.";
    }

    if (data.fullName.length > 100) {
        return "Full name must be 100 characters or fewer.";
    }

    if (data.email.length > 100) {
        return "Email must be 100 characters or fewer.";
    }

    return null; // Input is valid
};

// Initialize connection pool if it doesn't exist
async function initializePool() {
    try {
        if (pool === null) {
            pool = new sql.ConnectionPool(sqlConfig);
            await pool.connect();
        }
    } catch (error) {
        console.error("Failed to connect to SQL:", error);
        pool = null;
    }
}

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    context.log('HTTP trigger function processed a request to create a new user.');

    // Check for missing or malformed request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: "Request body is missing"
        };
        return;
    }

    const { fullName, email, azureAdId } = req.body as UserInput;

    // Validate input
    const validationError = validateInput({ fullName, email, azureAdId });
    if (validationError) {
        context.res = {
            status: 400, // Bad Request
            body: validationError,
        };
        return;
    }

    try {
        await initializePool();
        if (!pool) {
            throw new Error('Failed to establish a database connection.');
        }

        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // First Query: Check if the Azure AD ID already exists
            const userExistsRequest = new sql.Request(transaction);
            const userExistsQuery = `
                SELECT COUNT(*) AS count
                FROM Users
                WHERE aad_user_id = @azureAdId
            `;

            const userExistsResult = await userExistsRequest
                .input("azureAdId", sql.NVarChar, azureAdId)
                .query(userExistsQuery);

            if (userExistsResult.recordset[0].count > 0) {
                throw new Error('User already exists.');
            }

            // Second Query: Insert the new user
            const insertRequest = new sql.Request(transaction);
            const insertQuery = `
                DECLARE @OutputTable TABLE (Id INT);

                INSERT INTO Users (name, email, aad_user_id)
                OUTPUT INSERTED.Id INTO @OutputTable
                VALUES (@fullName, @email, @azureAdId);

                SELECT Id AS id FROM @OutputTable;
            `;

            const insertResult = await insertRequest
                .input("fullName", sql.NVarChar, fullName)
                .input("email", sql.VarChar, email)
                .input("azureAdId", sql.NVarChar, azureAdId)
                .query(insertQuery);

            const newUserId = insertResult.recordset[0].id;

            await transaction.commit();
            context.res = {
                status: 201,
                body: { userId: newUserId }
            };
        } catch (error) {
            context.log(`Transaction error: ${(error as Error).message}`);
            await transaction.rollback();

            // Log the error to the error_log table
            try {
                if (pool) {
                    await pool.request()
                        .input('errorMessage', sql.NVarChar, (error as Error).message)
                        .input('errorTime', sql.DateTime, new Date())
                        .query(`INSERT INTO error_log (error_message, error_time) VALUES (@errorMessage, @errorTime)`);
                }
            } catch (loggingError) {
                context.log(`Error logging error: ${(loggingError as Error).message}`);
            }

            context.res = {
                status: 500,
                body: `Error creating user: ${(error as Error).message}`
            };
        }
    // The catch block for the outer try block
    } catch (error) {
        context.res = {
            status: 500,
            body: `Database connection error: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
