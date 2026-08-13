BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.worker_role_assignments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        worker_id INT NOT NULL,
        worker_role_type_id INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL,
        CONSTRAINT FK_worker_role_assignments_worker_id FOREIGN KEY (worker_id) REFERENCES field_tracker.workers(id),
        CONSTRAINT FK_worker_role_assignments_worker_role_type_id FOREIGN KEY (worker_role_type_id) REFERENCES field_tracker.worker_role_types(id),
        CONSTRAINT FK_worker_role_assignments_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_worker_role_assignments_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_worker_role_assignments_deleted_by FOREIGN KEY (deleted_by) REFERENCES dbo.users(id)
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
        'CreateInstallTeamsTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
