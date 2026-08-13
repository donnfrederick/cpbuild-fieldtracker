BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.team_leads (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        status_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL,
        CONSTRAINT FK_team_leads_user_id FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_team_leads_status_id FOREIGN KEY (status_id) REFERENCES field_tracker.worker_status_types(id),
        CONSTRAINT FK_team_leads_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_team_leads_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_team_leads_deleted_by FOREIGN KEY (deleted_by) REFERENCES dbo.users(id)
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
