-- Create blocking_issue_scopes junction table if it doesn't exist

BEGIN TRANSACTION;

BEGIN TRY

    IF OBJECT_ID('field_tracker.blocking_issue_scopes', 'U') IS NULL
    BEGIN
        CREATE TABLE field_tracker.blocking_issue_scopes (
            id INT IDENTITY(1,1) PRIMARY KEY,
            issue_id INT NOT NULL,
            scope_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE()
        );

        -- Add UNIQUE constraint on (issue_id, scope_id) to prevent duplicate tags
        ALTER TABLE field_tracker.blocking_issue_scopes
        ADD CONSTRAINT UQ_blocking_issue_scopes_issue_scope
        UNIQUE (issue_id, scope_id);

        -- Create index on issue_id for fast scope lookups
        CREATE NONCLUSTERED INDEX IX_blocking_issue_scopes_issue_id
        ON field_tracker.blocking_issue_scopes (issue_id);

        -- Create index on scope_id for reverse lookups
        CREATE NONCLUSTERED INDEX IX_blocking_issue_scopes_scope_id
        ON field_tracker.blocking_issue_scopes (scope_id);

        PRINT 'Created field_tracker.blocking_issue_scopes table with indexes and constraints';
        
        -- NOTE: Foreign key constraints should be added once the referenced tables exist:
        -- FK_blocking_issue_scopes_issue_id -> blocking_issues(id)
        -- FK_blocking_issue_scopes_scope_id -> scopes(id)
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.blocking_issue_scopes already exists - skipping creation';
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    INSERT INTO dbo.error_log (
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        error_message,
        logged_at
    )
    VALUES (
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        ERROR_MESSAGE(),
        GETDATE()
    );

    THROW;
END CATCH;
