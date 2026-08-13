BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.worker_role_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        role_type_name NVARCHAR(255) NOT NULL,
        scope_type_id INT NOT NULL,
        description NVARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_worker_role_types_scope_type_id FOREIGN KEY (scope_type_id) REFERENCES field_tracker.scope_types(id)
    );

    INSERT INTO field_tracker.worker_role_types
        (role_type_name, scope_type_id)
    VALUES
        ('assembler', 1),
        ('installer', 1),
        ('installer', 2),
        ('installer', 8),
        ('installer', 5),
        ('installer', 6),
        ('installer', 7),
        ('skilled_laborer', 3),
        ('apprentice', 3),
        ('laborer', 3),
        ('team_lead', 3),
        ('skilled_laborer', 4),
        ('apprentice', 4),
        ('laborer', 4);

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
        'CreateInstallTeamsTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
