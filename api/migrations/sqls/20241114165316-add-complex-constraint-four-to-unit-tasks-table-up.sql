CREATE TRIGGER trg_EnforceAssignedWorkerForClearInspection
ON field_tracker.unit_tasks
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN field_tracker.unit_phases_by_scope ups ON i.phase_id = ups.id
        WHERE ups.phase_name = 'Clear Inspection' AND i.assigned_worker_id IS NULL
    )
    BEGIN
        RAISERROR ('assigned_worker_id cannot be NULL unless the phase name is "Clear Inspection".', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;