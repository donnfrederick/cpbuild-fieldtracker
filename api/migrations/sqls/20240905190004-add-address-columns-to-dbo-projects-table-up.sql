BEGIN TRANSACTION;

BEGIN TRY
    -- Alter dbo.projects table to add address and expected start date columns
    ALTER TABLE dbo.projects
    ADD 
        street_address NVARCHAR(255) NULL,
        city NVARCHAR(100) NULL,
        postal_code NVARCHAR(20) NULL,
        expected_start_date DATETIME NULL;

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
        'AddAddressFieldsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
/* Replace with your SQL commands */