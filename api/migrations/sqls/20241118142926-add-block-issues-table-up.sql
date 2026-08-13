BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.blocking_issues (
        id INT IDENTITY(1,1) PRIMARY KEY,
        unit_id INT NOT NULL,
        CONSTRAINT FK_BlockingIssues_Unit FOREIGN KEY (unit_id)
            REFERENCES field_tracker.units_by_scope (id),
        task_id INT NULL,
        CONSTRAINT FK_BlockingIssues_Task FOREIGN KEY (task_id)
            REFERENCES field_tracker.unit_tasks (id),
        issue_details NVARCHAR(2000) NOT NULL,
        status_id INT NOT NULL,
        CONSTRAINT FK_BlockingIssues_Status FOREIGN KEY (status_id)
            REFERENCES field_tracker.blocking_issue_status_types (id),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        CONSTRAINT FK_BlockingIssues_CreatedBy FOREIGN KEY (created_by)
            REFERENCES dbo.users (id),
        resolved_at DATETIME NULL,
        resolved_by INT NULL,
        CONSTRAINT FK_BlockingIssues_ResolvedBy FOREIGN KEY (resolved_by)
            REFERENCES dbo.users (id),
        resolution_details NVARCHAR(2000) NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        CONSTRAINT FK_BlockingIssues_UpdatedBy FOREIGN KEY (updated_by)
            REFERENCES dbo.users (id),
        deleted_at DATETIME NULL,
        deleted_by INT NULL,
        CONSTRAINT FK_BlockingIssues_DeletedBy FOREIGN KEY (deleted_by)
            REFERENCES dbo.users (id)
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
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;