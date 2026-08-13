CREATE TRIGGER trg_EnforceUniquePhaseAndScope
ON field_tracker.unit_tasks
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT i.phase_id, i.unit_by_scope_id
        FROM inserted i
        JOIN field_tracker.unit_phases_by_scope ups ON i.phase_id = ups.id
        WHERE ups.main_task_required = 1
        GROUP BY i.phase_id, i.unit_by_scope_id
        HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR ('The combination of phase_id and unit_by_scope_id must be unique when main_task_required is TRUE.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;