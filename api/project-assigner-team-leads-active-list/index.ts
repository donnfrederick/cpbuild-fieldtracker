import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function scopeAssignment(teamLeadId: number): Promise<any> {
    if (teamLeadId <= 0) {
        return; // Assuming IDs are positive integers
    }
    
    const query = `
        SELECT
            tlsa.scope_type_id as scopeTypeId,
            st.scope_name as scopeName
        FROM field_tracker.team_lead_scope_assignments tlsa
        JOIN field_tracker.scope_types st ON tlsa.scope_type_id = st.id
        WHERE tlsa.team_lead_id = @teamLeadId
        AND tlsa.is_active = 1;
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('teamLeadId', sql.Int, teamLeadId)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the active Team Leads along with their scope assignments.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let query = `
        SELECT
            tl.id,
            usr.id as userId,
            usr.name
        FROM
            field_tracker.team_leads tl
        JOIN
            field_tracker.worker_status_types wst ON tl.status_id = wst.id
        JOIN
            dbo.users usr ON tl.user_id = usr.id
        WHERE usr.active = 1
            AND tl.status_id = 1
    `;

    try {
        const request = pool.request();

        const result = await request
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.scopeAssignments = await scopeAssignment(row.id);
            }

            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 404,
                body: 'No active team leads found.'
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
