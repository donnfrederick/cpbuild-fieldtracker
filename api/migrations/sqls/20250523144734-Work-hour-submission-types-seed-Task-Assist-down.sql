IF EXISTS (
    SELECT 1
    FROM field_tracker.work_hour_submission_types
    WHERE type_name = 'Task Assist'
)
BEGIN
    DELETE FROM field_tracker.work_hour_submission_types
    WHERE type_name = 'Task Assist';
END