CREATE TRIGGER trg_EnforceParentTaskConstraint
ON field_tracker.unit_tasks
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN field_tracker.task_types utt ON i.task_type_id = utt.id
        WHERE i.parent_task_id IS NOT NULL AND utt.type_name = 'Main'
    )
    BEGIN
        RAISERROR ('Parent task cannot be set for main task types.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;