-- Check if the foreign key constraint exists and drop it
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_UnitTasks_RootMainTask'
      AND parent_object_id = OBJECT_ID('field_tracker.unit_tasks')
)
BEGIN
    ALTER TABLE field_tracker.unit_tasks
    DROP CONSTRAINT FK_UnitTasks_RootMainTask;
END

-- Check if the column exists and drop it
IF COL_LENGTH('field_tracker.unit_tasks', 'root_main_task_id') IS NOT NULL
BEGIN
    ALTER TABLE field_tracker.unit_tasks
    DROP COLUMN root_main_task_id;
END
