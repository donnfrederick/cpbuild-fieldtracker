CREATE TRIGGER trg_EnforceProjectScopeMatch
ON field_tracker.work_hour_submissions
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN field_tracker.ihi_unit_tasks t ON i.task_id = t.id
        JOIN field_tracker.projects_by_scope pbs ON i.project_by_scope_id = pbs.id
        WHERE i.task_id IS NOT NULL 
          AND t.ihi_project_id <> pbs.ihi_project_id
    )
    BEGIN
        RAISERROR ('task_id project scope does not match project_by_scope_id scope.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;