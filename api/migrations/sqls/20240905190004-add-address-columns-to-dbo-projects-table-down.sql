BEGIN TRANSACTION;

BEGIN TRY
    -- Revert changes by dropping the added columns
    IF EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'dbo.projects') 
               AND name IN (N'street_address', N'city', N'postal_code', N'expected_start_date'))
    BEGIN
        -- Drop columns one by one
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.projects') AND name = N'street_address')
        BEGIN
            ALTER TABLE dbo.projects
            DROP COLUMN street_address;
        END

        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.projects') AND name = N'city')
        BEGIN
            ALTER TABLE dbo.projects
            DROP COLUMN city;
        END

        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.projects') AND name = N'postal_code')
        BEGIN
            ALTER TABLE dbo.projects
            DROP COLUMN postal_code;
        END

        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.projects') AND name = N'expected_start_date')
        BEGIN
            ALTER TABLE dbo.projects
            DROP COLUMN expected_start_date;
        END
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
        'RevertAddressFieldsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
