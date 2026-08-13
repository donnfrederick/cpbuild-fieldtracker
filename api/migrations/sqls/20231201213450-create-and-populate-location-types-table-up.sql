BEGIN TRANSACTION;

BEGIN TRY
    -- Create sub_prime_code table
    CREATE TABLE field_tracker.location_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        location_type_name NVARCHAR(255) NOT NULL UNIQUE,
        location_type_description NVARCHAR(255) NOT NULL
    );

    -- Populate uom_types
    INSERT INTO field_tracker.location_types (location_type_name, location_type_description) VALUES ('C', 'Common');
    INSERT INTO field_tracker.location_types (location_type_name, location_type_description) VALUES ('U', 'Unit');

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