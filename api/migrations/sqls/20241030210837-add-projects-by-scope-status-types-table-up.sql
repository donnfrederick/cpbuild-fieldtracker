BEGIN TRANSACTION;

BEGIN TRY
    -- Create scope_details table
    CREATE TABLE field_tracker.projects_by_scope_status_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        status_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    -- Populate sub_prime_codes table with a subquery to get prime_code_id
    INSERT INTO field_tracker.projects_by_scope_status_types (status_name, description, is_active)
    VALUES
    ('Created', 'Created', 1),
    ('Active', 'Active', 1),
    ('Inactive', 'Inactive', 1),
    ('Complete', 'Complete', 1),
    ('Removed', 'Removed', 1);

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
        'projectsByScopeStatusTypesMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;