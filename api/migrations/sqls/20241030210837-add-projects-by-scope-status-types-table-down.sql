BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the projects_by_scope_status_types table if it exists
    IF OBJECT_ID('field_tracker.projects_by_scope_status_types', 'U') IS NOT NULL
    BEGIN
        DROP TABLE field_tracker.projects_by_scope_status_types;
    END

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
        'projectsByScopeStatusTypesDownMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;