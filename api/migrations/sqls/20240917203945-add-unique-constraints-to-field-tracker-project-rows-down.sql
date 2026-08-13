BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the unique constraint
    ALTER TABLE field_tracker.project_rows
    DROP CONSTRAINT UQ_project_rows;

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
        'DropUniqueConstraintMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
