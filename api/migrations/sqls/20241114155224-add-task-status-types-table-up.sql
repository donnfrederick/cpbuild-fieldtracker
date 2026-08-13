BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.task_status_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        status_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.task_status_types (status_name, description, is_active)
    VALUES
        ('Not Ready', 'does not have the necessary tasks assigned or scheduled, or is waiting on another phase to complete.', 1),
        ('Ready', 'All required assignments, scheduling, and blocking phases have been complete.', 1),
        ('Started', 'Task has at least one work hours submission.', 1),
        ('Submitted', 'Entire quantity has been submitted as work hour submissions, all checklist items checked, images uploaded, and unit has been submitted for review.', 1),
        ('Passed', 'Task submission has passed review and does not require a child subtask in order to resolve any issues or missed requirements.', 1),
        ('Failed', 'Task submission has issues that need to be resolved in a child Punch Work subtask. Ultimate task completion will be tracked by any child tickets but this task will always display as failed to keep historical submission and status context.', 1);

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