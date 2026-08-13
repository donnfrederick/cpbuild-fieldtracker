IF NOT EXISTS (
    SELECT 1
    FROM field_tracker.work_hour_submission_types
    WHERE type_name = 'Task Assist'
)
BEGIN
    INSERT INTO field_tracker.work_hour_submission_types
        (type_name, task_type_id, phase_id, pay_type_id, description, is_active)
    VALUES
        (
            'Task Assist',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Task Assist'),
            1,
            1,
            NULL,
            1 
        );
END