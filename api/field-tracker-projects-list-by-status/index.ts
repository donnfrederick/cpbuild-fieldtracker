import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const projectStatus = context.bindingData.projectStatus;
    context.log(`HTTP trigger function processed a request to get the list of ${projectStatus} Field Tracker Projects.`);

    const validStatusTypes = ['active', 'completed', 'deleted', 'all'];

    if (!validStatusTypes.includes(projectStatus)) {
        context.res = {
            status: 400,
            body: `Invalid project status type: ${projectStatus}`
        };
        return;
    }

    const pool = await initializePool(databaseIdentifier, sqlConfig);

    let statusFilter = projectStatus !== 'all' ? "WHERE pst.status_name = @projectStatus" : "";

    const getProjectsQuery = `
        SELECT
            ft.id as rootProjectId,
            ft.project_id AS ftProjectId,
            td.project_name AS projectName,
            td.salesforce_project_id AS salesforceId,
            pm.name AS projectManagerName,
            td.project_manager_id AS projectManagerId,
            im.name AS installManagerName,
            td.install_manager_id AS installManagerId,
            s.name AS stateName,
            s.code AS stateCode,
            s.id AS stateId,
            td.street_address AS siteLocStreetAddress,
            td.city AS siteLocCity,
            td.postal_code AS siteLocPostalCode,
            td.expected_start_date AS expectedStartDate,
            ft.created_at AS createdAt,
            cbu.name AS createdByName,
            ft.created_by AS createdById,
            ft.updated_at AS updatedAt,
            ft.updated_by AS updatedById,
            ubu.name AS updatedByName
        FROM
            field_tracker.projects ft
        INNER JOIN
            dbo.projects td ON ft.project_id = td.id
        INNER JOIN
            dbo.users pm ON td.project_manager_id = pm.id
        LEFT JOIN
            dbo.users im ON td.install_manager_id = im.id
        LEFT JOIN
            dbo.states s ON td.state_id = s.id
        INNER JOIN
            field_tracker.project_status_types pst ON ft.project_status_id = pst.id
        LEFT JOIN
            dbo.users cbu ON ft.created_by = cbu.id
        LEFT JOIN
            dbo.users ubu ON ft.updated_by = ubu.id
        ${statusFilter}
    `;

    try {
        const request = pool.request();

        // Conditionally add the projectStatus parameter if not 'all'
        if (projectStatus !== 'all') {
            request.input('projectStatus', sql.VarChar, projectStatus);
        }

        const result = await request.query(getProjectsQuery);

        if (result.recordset.length > 0) {
            context.log(`Found ${result.recordset.length} Field Tracker projects with status: ${projectStatus}`);
            context.res = {
                body: result.recordset
            };
        } else {
            context.log(`No Field Tracker projects found that match the specified status of "${projectStatus}".`);
            context.res = {
                status: 200,
                body: `No Field Tracker projects found that match the specified status of "${projectStatus}".`
            };
        }
    } catch (error) {
        context.log(`Error occurred retrieving Field Tracker projects with status: ${projectStatus}: ${(error as Error).message}`);
        context.res = {
            status: 500,
            body: `Error occurred retrieving Field Tracker projects with status: ${projectStatus}: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;