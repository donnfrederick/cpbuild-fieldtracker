BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.work_classification_types (
        id INT PRIMARY KEY IDENTITY(1,1),
        type_name NVARCHAR(255) UNIQUE NOT NULL,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.work_classification_types (type_name, description, is_active)
    VALUES
        ('Productive', 'Tasks that directly contribute to output', 1),
        ('Non-productive', 'Tasks that do not directly produce output', 1),
        ('Punch Work', 'Specific to punch work tasks. Not productive but different from other non-productive work types', 1);


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