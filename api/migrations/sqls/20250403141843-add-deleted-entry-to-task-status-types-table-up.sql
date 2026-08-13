BEGIN TRANSACTION;

BEGIN TRY
    INSERT INTO field_tracker.task_status_types (
        status_name,
        description,
        is_active
    ) VALUES (
        'Deleted',
        'Task is no longer needed or was made by mistake.',
        1
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'AddFKToBlockingIssues'
    );

    THROW;
END CATCH;
