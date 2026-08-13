BEGIN TRANSACTION;

BEGIN TRY
    -- Drop transaction_id and transaction_type columns from field_tracker.projects table
    ALTER TABLE field_tracker.projects
    DROP COLUMN transaction_id,
    DROP COLUMN transaction_type;

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
        'RemoveTransactionFieldsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
