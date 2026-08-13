BEGIN TRANSACTION;

BEGIN TRY
    DELETE FROM field_tracker.task_types
    WHERE type_name = 'Lead Time'
      AND description = 'Lead Time'
      AND task_level_id = 2
      AND work_classification_id = 2;

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
        'RemoveTileScopeScript'
    );

    THROW;
END CATCH;