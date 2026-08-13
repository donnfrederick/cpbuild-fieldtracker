BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.worker_role_types
    ADD CONSTRAINT UQ_worker_role_types
    UNIQUE (role_type_name, scope_type_id);

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
        'AddUniqueConstraintMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
