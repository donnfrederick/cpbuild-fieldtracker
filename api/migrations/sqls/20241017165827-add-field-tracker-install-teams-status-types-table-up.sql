BEGIN TRANSACTION;

BEGIN TRY
    -- Create field_tracker.install_teams_status_types table
    CREATE TABLE field_tracker.install_teams_status_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        status_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL DEFAULT '',
        is_active BIT NOT NULL DEFAULT 1
    );

    -- Insert initial data (is_active will default to 1)
    INSERT INTO field_tracker.install_teams_status_types (status_name, description)
    VALUES 
        ('active', 'Active status'),
        ('inactive', 'Inactive status'),
        ('revoked', 'Revoked status');

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
        'CreateInstallTeamsStatusTypesTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
