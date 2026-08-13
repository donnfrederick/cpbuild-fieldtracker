BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.prime_codes (
        id INT IDENTITY(1, 1) PRIMARY KEY,
        prime_code TINYINT NOT NULL UNIQUE,
        prime_code_description NVARCHAR(255) NOT NULL
    );

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