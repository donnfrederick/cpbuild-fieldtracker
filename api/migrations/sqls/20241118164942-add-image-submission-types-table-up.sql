BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.image_submission_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.image_submission_types (type_name, description)
    VALUES
        ('work_hours_submission', 'Submitted work hours for both paid and non-paid work related to unit specific tasks (including punch work) as well as project specific work like staging and nonproductive work.'),
        ('task_requirements', 'Requirements that are defined by the Team Lead or Install Manager when custom details are required (non-main type tasks). This will be for images uploaded defining Modifications, Trade Damage Repair, as well as Punch Work tasks.'),
        ('task_submission', 'Images showing work related to specific task submissions.'),
        ('task_submission_review', 'Images related to task submission reviews - more specifically for documentation if the task passes since a punch work task will be created for failed tasks causing those images to be part of the requirements for the new Punch Work task that is created.'),
        ('blocking_issue_details', 'When an issue is discovered and reported related to a specific unit by scope, images uploaded to the blocking issue.'),
        ('blocking_issue_resolution', 'Any images uploaded to demonstrate that a blocking issue has been resolved.');

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error to the error_log table
    INSERT INTO dbo.error_log (
        error_message,
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        user_name,
        app_name
    ) VALUES (
        ERROR_MESSAGE(),
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        SUSER_SNAME(),
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;