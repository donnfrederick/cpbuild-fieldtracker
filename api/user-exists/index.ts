import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';

// Define SQL Server connection options
const sqlConfig: sql.config = baseConfig.toolsDashboard;
let pool: sql.ConnectionPool | null = null;

// Initialize connection pool if it doesn't exist
async function initializePool(context: Context) {
    try {
        if (pool === null) {
            pool = new sql.ConnectionPool(sqlConfig);
            await pool.connect();
        }
    } catch (error) {
        context.log("Failed to connect to SQL:", error);  // Use context.log
        pool = null;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('YOU MADE IT INSIDE THE USER EXISTS ENDPOINT!');
    const aadUserId: string = context.bindingData.aadUserId.toString();
    context.log(`User ID: ${aadUserId}`);

    await initializePool(context);

    try {
        if (aadUserId) {
            const userExistsQuery = `
                SELECT *
                FROM Users
                WHERE aad_user_id = @aadUserId
            `;
            const result = await pool?.request()
                .input("aadUserId", sql.NVarChar(60), aadUserId)
                .query(userExistsQuery);

            if (result && result.recordset.length > 0) {
                context.log(`User ${aadUserId} exists`);
                context.res = { body: result.recordset[0] };
            } else {
                context.log(`User with ${aadUserId} as the AAD user id does not exist`);
                context.res = { status: 404, body: "User with this current AAD user id does not exist" };
            }
        } else {
            context.res = { status: 400, body: "User ID is required" };
        }
    } catch (error) {
        context.log(`Error occurred: ${(error as Error).message}`);
        context.res = { status: 500, body: `Error checking if user exists, please try again later: ${(error as Error).message}` };
    }
};

export default httpTrigger;