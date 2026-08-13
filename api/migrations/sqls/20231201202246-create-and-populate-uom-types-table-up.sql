BEGIN TRANSACTION;

BEGIN TRY
    -- Create sub_prime_code table
    CREATE TABLE field_tracker.uom_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        uom_name NVARCHAR(255) NOT NULL UNIQUE,
        uom_description NVARCHAR(255) -- Nullable column
    );

    -- Populate uom_types
    INSERT INTO field_tracker.uom_types (uom_name) VALUES ('EA');
    INSERT INTO field_tracker.uom_types (uom_name) VALUES ('SF');
    INSERT INTO field_tracker.uom_types (uom_name) VALUES ('SY');
    INSERT INTO field_tracker.uom_types (uom_name) VALUES ('LF');

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
        'SubPrimeCodeMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;