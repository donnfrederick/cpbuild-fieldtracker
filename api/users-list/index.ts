import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
let pool: sql.ConnectionPool | null = null;

// Initialize connection pool if it doesn't exist
async function initializePool() {
    if (pool) return; // If pool already exists, return
    try {
        pool = new sql.ConnectionPool(sqlConfig);
        await pool.connect();
    } catch (error) {
        console.error("Failed to connect to SQL:", error);
        pool = null;
        throw new Error("Failed to initialize pool");
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to get all users');

    try {
        await initializePool();
    } catch (error) {
        context.res = {
            status: 500,
            body: "Failed to initialize database connection."
        };
        return;
    }

    const getUsersQuery = `
        SELECT id, name
        FROM dbo.users
        WHERE active = 1
    `;

    try {
        const result = await pool?.request().query(getUsersQuery);

        if (result?.recordset.length) {
            context.log(`Found ${result.recordset.length} users`);
            context.res = {
                body: result.recordset
            };
        } else {
            context.log("No users found");
            context.res = {
                status: 404,
                body: "No users found"
            };
        }
    } catch (error) {
        context.log(`Error occurred retrieving all active users: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: `Error occurred while retrieving all active users: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;