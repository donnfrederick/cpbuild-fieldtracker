BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.projects
    ADD man_hours_per_day TINYINT NOT NULL DEFAULT 8;

    -- UPDATE field_tracker.projects
    -- SET man_hours_per_day = 8
    -- WHERE man_hours_per_day IS NULL;

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
        'ProjectsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
