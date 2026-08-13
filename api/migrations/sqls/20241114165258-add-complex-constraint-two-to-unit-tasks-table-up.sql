CREATE TRIGGER trg_EnforcePhaseForMainTask
ON field_tracker.unit_tasks
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN field_tracker.task_types utt ON i.task_type_id = utt.id
        WHERE utt.type_name = 'Main' AND i.phase_id IS NULL
    )
    BEGIN
        RAISERROR ('phase_id cannot be NULL for main task types.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;