import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from 'mssql';
import { baseConfig } from '../dbConfig';
import { initializePool } from '../services/dbService';

const sqlConfig: sql.config = baseConfig.toolsDashboard;
const databaseIdentifier = baseConfig.toolsDashboard.database;

async function getUnitTasks(projectByScopeId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(`
                SELECT
                    ut.id,
                    ut.parent_task_id AS parentTaskId,
                    ut.task_type_id AS taskTypeId,
                    tt.type_name AS taskTypeName, -- Get task type name from task_types table
                    ut.phase_id AS phaseId,
                    ut.status_id AS taskStatusId,
                    tst.status_name AS taskStatusName, -- Get status name from task_status_types table
                    ut.assigned_worker_id AS assignedWorkerId,
                    ut.scheduled_date AS scheduledDate,
                    ut.submitted_at AS submittedAt,
                    ut.reviewed_at AS reviewedAt,
                    ubs.id AS unitByScopeId,
                    ubs.current_phase_id AS currentPhaseId,
                    upbs.phase_name AS currentPhaseName, -- Get phase name from unit_phases_by_scope table
                    ubs.status_id AS unitByScopeStatusTypeId,
                    ubsst.status_name AS unitByScopeStatusName -- Get unit scope status name from unit_by_scope_status_types
                FROM field_tracker.unit_tasks ut
                JOIN field_tracker.units_by_scope ubs ON ut.unit_by_scope_id = ubs.id
                JOIN field_tracker.task_types tt ON ut.task_type_id = tt.id -- Join to get taskTypeName
                JOIN field_tracker.task_status_types tst ON ut.status_id = tst.id -- Join to get taskStatusName
                JOIN field_tracker.unit_phases_by_scope upbs ON ubs.current_phase_id = upbs.id -- Join to get phase name
                JOIN field_tracker.unit_by_scope_status_types ubsst ON ubs.status_id = ubsst.id -- Join to get unit scope status name
                WHERE ubs.project_by_scope_id = @projectByScopeId
            `);
        return result.recordset.length > 0 ? result.recordset : [];
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
        return [];
    }
}

async function getUnitCount(project_by_scope_id: number): Promise<number> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('project_by_scope_id', sql.Int, project_by_scope_id)
            .query(`
                SELECT COUNT(*) AS unitCount
                FROM field_tracker.units_by_scope ubs
                WHERE ubs.project_by_scope_id = @project_by_scope_id
            `);

        return result.recordset[0].unitCount;
    } catch (error) {
        console.error(`Error retrieving unit count:`, error);
        return 0; // Ensure function returns a valid number in case of error
    }
}

async function getUnitsWithoutStagingDateCount(projectByScopeId: number): Promise<number> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(`
                SELECT COUNT(*) AS missingStagingCompletionCount
                FROM field_tracker.units_by_scope ubs
                WHERE ubs.project_by_scope_id = @projectByScopeId
                AND ubs.staging_completion_date IS NULL
            `);

        return result.recordset[0]?.missingStagingCompletionCount || 0;
    } catch (error) {
        console.error(`Error retrieving staging completion count:`, error);
        return 0; // Ensure function returns a valid number in case of error
    }
}

async function getProjectByScope(projectByScopeId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(`SELECT id,
                    project_id,
                    scope_type_id,
                    status_id,
                    team_lead_id
                FROM field_tracker.projects_by_scope
                WHERE id = @projectByScopeId
            `);
        return result.recordset[0];
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
}

async function getUnitPhasesByScope(scopeTypeId: number): Promise<any> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('scopeTypeId', sql.Int, scopeTypeId)
            .query(`SELECT id,
                    phase_name,
                    scope_type_id,
                    phase_order,
                    version,
                    main_task_required,
                    worker_assignment_required,
                    worker_assignment_display_name,
                    has_checklist_items,
                    image_acknowledgment_text,
                    scheduling_required,
                    incremental_weight_percent,
                    initial_cumulative_percent,
                    final_cumulative_percent,
                    description
                FROM field_tracker.unit_phases_by_scope
                WHERE scope_type_id = @scopeTypeId
            `);
        return result.recordset;
    } catch (error) {
        console.error(`Error checking if id is valid:`, error);
    }
}

async function getBlockingIssuesCount(projectByScopeId: number, context: Context): Promise<number> {
    try {
        const pool = await initializePool(databaseIdentifier, sqlConfig);
        const result = await pool.request()
            .input('projectByScopeId', sql.Int, projectByScopeId)
            .query(`
                SELECT COUNT(bi.id) AS blockingIssuesCount
                FROM field_tracker.blocking_issues bi
                JOIN field_tracker.units_by_scope ubs ON bi.unit_id = ubs.id -- Ensure correct FK reference
                WHERE bi.status_id = 1
                AND ubs.project_by_scope_id = @projectByScopeId
            `);

        context.log(`Blocking Issues Count Result:`, result.recordset); // Azure Function logging

        return result.recordset.length > 0 ? result.recordset[0].blockingIssuesCount : 0;
    } catch (error) {
        context.log.error(`Error getting blocking issues count:`, error);
        return 0;
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request to list all action needed unit tasks.');

    const projectByScopeId = context.bindingData.projectByScopeId;
    const unitCount = await getUnitCount(projectByScopeId);
    const unitTasks = await getUnitTasks(projectByScopeId);
    const unitsWithoutStagingDateCount = await getUnitsWithoutStagingDateCount(projectByScopeId);

    try {
        const projectByScope = await getProjectByScope(projectByScopeId);
        const unitPhasesByScope = await getUnitPhasesByScope(projectByScope.scope_type_id);

        let phases: any = [];
        unitPhasesByScope.forEach((phase: any) => {
            if (phase.phase_order == 1) {
                phases.push({
                    id: phase.id,
                    name: phase.phase_name + " Phase",
                    completionDateNeeded: unitsWithoutStagingDateCount,
                    order: phase.phase_order
                });
            } else {
                let data: any = {
                    id: phase.id,
                    name: phase.phase_name + " Phase"
                };

                const totalTasksAssignedToPhase = unitTasks.filter((task: any) => task.phaseId === phase.id).length;
                const scheduledTaskCount = unitTasks.filter((task: any) => task.phaseId === phase.id && task.scheduledDate !== null).length;
                const tasksWithWorkerAssignmentCount = unitTasks.filter((task: any) => task.phaseId === phase.id && task.assignedWorkerId !== null && task.taskTypeName === 'Main').length;
                const tasksNeedingReview = unitTasks.filter((task: any) => task.phaseId === phase.id && task.taskStatusName === 'Submitted' && task.reviewedAt === null).length;
                const taskResubmissionsNeedingReviewCount = unitTasks.filter((task: any) =>
                    task.phaseId === phase.id &&
                    task.submittedAt !== null &&
                    task.reviewedAt === null &&
                    task.taskStatusName === 'Submitted' &&
                    task.taskTypeName === "Punch Work" &&
                    task.parentTaskId !== null
                ).length;
                const punchWorkSubmissionsNeedingReviewCount = unitTasks.filter((task: any) =>
                    task.phaseId === phase.id &&
                    task.submittedAt !== null &&
                    task.reviewedAt === null &&
                    task.taskStatusName === 'Submitted' &&
                    task.taskTypeName === "Punch Work"
                ).length;
                const modificationSubmissionsNeedingReviewCount = unitTasks.filter((task: any) =>
                    task.phaseId === phase.id &&
                    task.submittedAt !== null &&
                    task.reviewedAt === null &&
                    task.taskStatusName === 'Submitted' &&
                    task.taskTypeName === "Modification"
                ).length;
                const tradeDamageRepairSubmissionsNeedingReviewCount = unitTasks.filter((task: any) =>
                    task.phaseId === phase.id &&
                    task.submittedAt !== null &&
                    task.reviewedAt === null &&
                    task.taskStatusName === 'Submitted' &&
                    task.taskTypeName === "Trade Damage Repair"
                ).length;


                if (phase.main_task_required) {
                    data.tasksAssignedToPhaseCount = totalTasksAssignedToPhase;
                    data.schedulingNeeded = phase.phase_name == 'Clear Inspection' ? 0 : unitCount - scheduledTaskCount;
                    data.workerAssignmentNeeded = phase.phase_name == 'Clear Inspection' ? 0 : unitCount - tasksWithWorkerAssignmentCount;
                    data.reviewNeeded = tasksNeedingReview;
                    data.resubmissionsNeedingReview = taskResubmissionsNeedingReviewCount;
                    data.punchWorkSubmissionsNeedingReview = punchWorkSubmissionsNeedingReviewCount;
                    data.modificationSubmissionsNeedingReview = modificationSubmissionsNeedingReviewCount;
                    data.tradeDamageRepairSubmissionsNeedingReview = tradeDamageRepairSubmissionsNeedingReviewCount;
                } else {
                    data.tasksAssignedToPhaseCount = totalTasksAssignedToPhase;
                    data.reviewNeeded = tasksNeedingReview;
                    data.workerAssignmentNeeded = 0;
                    data.schedulingNeeded = 0;
                    data.resubmissionsNeedingReview = taskResubmissionsNeedingReviewCount;
                    data.punchWorkSubmissionsNeedingReview = punchWorkSubmissionsNeedingReviewCount;
                    data.modificationSubmissionsNeedingReview = modificationSubmissionsNeedingReviewCount;
                    data.tradeDamageRepairSubmissionsNeedingReview = tradeDamageRepairSubmissionsNeedingReviewCount;
                }

                data.order = phase.phase_order;

                phases.push(data);
            }
        });

        phases.push({
            id: null,
            name: "Blocked Units",
            unitsWithBlockingIssue: await getBlockingIssuesCount(projectByScopeId, context)
        });

        context.res = {
            status: 200,
            body: phases
        };
    } catch (error) {
        console.error(`Error retrieving unit tasks:`, error);
        context.res = {
            status: 400,
            body: {
                message: "Error retrieving action needed data."
            }
        };
    }
};

export default httpTrigger;
