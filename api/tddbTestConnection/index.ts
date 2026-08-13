import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as sql from "mssql";
import * as fs from "fs";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH as string);
    const certificate = fs.readFileSync(process.env.CERT_PATH as string);

    const config: sql.config = {
        user: process.env.TOOLS_DASHBOARD_DB_USER as string,
        password: process.env.TOOLS_DASHBOARD_DB_PASSWORD as string,
        server: process.env.TOOLS_DASHBOARD_DB_SERVER as string,
        database: process.env.TOOLS_DASHBOARD_DB_DATABASE as string,
        options: {
            encrypt: false
        }
    };

    context.log('The sql config is set to:' + JSON.stringify(config, null, 2));

    try {
        await sql.connect(config);

        const result = await sql.query`SELECT * FROM Users`;

        context.res = {
            status: 200,
            body: result.recordset
        };
    } catch (error) {
        context.log.error('Database query failed: ', error);
        context.res = {
            status: 500,
            body: `Database connection error: ${error}`
        };
    }
};

export default httpTrigger;