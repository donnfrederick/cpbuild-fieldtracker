IF COL_LENGTH('field_tracker.unit_tasks', 'root_main_task_id') IS NULL
BEGIN
    ALTER TABLE field_tracker.unit_tasks
    ADD root_main_task_id INT NULL;

    ALTER TABLE field_tracker.unit_tasks
    ADD CONSTRAINT FK_UnitTasks_RootMainTask
    FOREIGN KEY (root_main_task_id)
    REFERENCES field_tracker.unit_tasks(id);
END
