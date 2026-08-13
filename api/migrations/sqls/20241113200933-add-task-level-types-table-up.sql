BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.task_level_types (
        id INT PRIMARY KEY IDENTITY(1,1),
        type_name NVARCHAR(255) UNIQUE NOT NULL,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.task_level_types (type_name, description, is_active)
    VALUES
        ('Unit Level', 'A task or work hours submission that is submitted at the unit level', 1),
        ('Project Level', 'Work hours that are submitted at a project level and not associated with a specific unit in the project', 1);

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
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;