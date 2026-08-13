import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function quantityData(quantity: number, workHourSubmissionTypeName: string, unitId: number, context: Context) {
    const qtyData = {
        setQuantity: 0,
        installedQuantities: {
            plannedQuantities: 0,
            addedQuantities: 0
        }
    };

    const query = `
        SELECT
            quantity
        FROM field_tracker.project_rows
        WHERE id = @unitId
    `;

    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('unitId', sql.Int, unitId)
            .query(query);

        if (result.recordset.length > 0) {
            if (workHourSubmissionTypeName == "Planned Quantity") qtyData.installedQuantities.plannedQuantities = quantity;
            else if (workHourSubmissionTypeName == "Added Quantity") qtyData.installedQuantities.addedQuantities = quantity;

            qtyData.setQuantity = result.recordset[0].quantity;

            return qtyData;
        } else return null;
    } catch (error) {
        context.log(error);
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all the work hour submissions.');

    const pool = await initializePool(databaseIdentifier, sqlConfig);
    const projectByScopeId = context.bindingData.projectByScopeId;

    const query = `
        SELECT
            whs.id,
            w.user_id as workerUserId,
            u.name as workerName,
            pbs.id as projectByScopeId,
            pbs.team_lead_id as projectByScopeTeamLead,
            tl.user_id as teamLeadUserId,
            ft_p.id as ftProjectId,
            dbo_p.id as dboProjectId,
            dbo_p.project_name as dboProjectName,
            st.id as scopeTypeId,
            st.scope_name as scopeTypeName,
            ut.id as unitTaskId,
            upbs.id as unitPhasesByScopeId,
            upbs.phase_name as unitPhasesByScopeName,
            tt.id as taskTypeId,
            tt.type_name as taskTypeName,
            ubs.id as unitByScopeId,
            pr.id as unitId,
            pr.building,
            pr.building_level as level,
            pr.unit,
            pr.area,
            wrt.id as workerRoleTypeId,
            wrt.role_type_name as workerRoleTypeName,
            whst.id as workHourSubmissionTypeId,
            whst.type_name as workHourSubmissionTypeName,
            whsst.id as workHourSubmissionStatusTypeId,
            whsst.status_name as workHourSubmissionStatusTypeName,
            whs.hours,
            whs.hours_override as hoursOverride,
            whs.quantity,
            whs.quantity_override as quantityOverride,
            whs.submission_date as submissionDate,
            whs.submission_notes as submissionNotes,
            whs.manager_notes as managerNotes
        FROM field_tracker.work_hour_submissions whs
        LEFT JOIN field_tracker.workers w ON whs.worker_id = w.id
        LEFT JOIN dbo.users u ON w.user_id = u.id
        LEFT JOIN field_tracker.projects_by_scope pbs ON whs.project_by_scope_id = pbs.id
        LEFT JOIN field_tracker.team_leads tl ON pbs.team_lead_id = tl.id -- Added this join
        LEFT JOIN field_tracker.projects ft_p ON pbs.project_id = ft_p.id
        LEFT JOIN dbo.projects dbo_p ON ft_p.project_id = dbo_p.id
        LEFT JOIN field_tracker.scope_types st ON pbs.scope_type_id = st.id
        LEFT JOIN field_tracker.unit_tasks ut ON whs.task_id = ut.id
        LEFT JOIN field_tracker.unit_phases_by_scope upbs ON ut.phase_id = upbs.id
        LEFT JOIN field_tracker.task_types tt ON ut.task_type_id = tt.id
        LEFT JOIN field_tracker.units_by_scope ubs ON ut.unit_by_scope_id = ubs.id
        LEFT JOIN field_tracker.project_rows pr ON ubs.unit_id = pr.id
        LEFT JOIN field_tracker.worker_role_types wrt ON whs.role_id = wrt.id
        LEFT JOIN field_tracker.work_hour_submission_types whst ON whs.submit_type_id = whst.id
        LEFT JOIN field_tracker.work_hour_submission_status_types whsst ON whs.status_id = whsst.id
        WHERE pbs.id = @projectByScopeId
    `;

    try {
        const request = pool.request();

        const result = await request
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(query);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                row.quantities = await quantityData(row.quantity, row.workHourSubmissionTypeName, row.unitId, context);
            }

            context.res = {
                body: result.recordset
            };
        } else {
            context.res = {
                status: 200,
                body: 'No result found.'
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
