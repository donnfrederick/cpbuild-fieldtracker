BEGIN TRANSACTION;

BEGIN TRY
    -- Alter field_tracker.projects table to add transaction_id and transaction_type columns
    ALTER TABLE field_tracker.projects
    ADD 
        transaction_id INT NULL,
        transaction_type NVARCHAR(255) NULL;

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
        'AddTransactionFieldsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
