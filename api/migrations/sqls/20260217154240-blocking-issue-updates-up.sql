BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Create blocking_issue_updates table
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'blocking_issue_updates')
    BEGIN
        CREATE TABLE field_tracker.blocking_issue_updates (
            id INT IDENTITY(1,1) NOT NULL,
            parent_issue_id INT NOT NULL,
            update_text NVARCHAR(MAX) NOT NULL,
            created_by INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_by INT NULL,
            deleted_at DATETIME NULL,
            
            CONSTRAINT PK_blocking_issue_updates PRIMARY KEY (id),
            CONSTRAINT FK_blocking_issue_updates_parent_issue FOREIGN KEY (parent_issue_id) 
                REFERENCES field_tracker.blocking_issues(id),
            CONSTRAINT FK_blocking_issue_updates_created_by FOREIGN KEY (created_by) 
                REFERENCES dbo.users(id),
            CONSTRAINT FK_blocking_issue_updates_deleted_by FOREIGN KEY (deleted_by) 
                REFERENCES dbo.users(id)
        );
        
        PRINT 'Created field_tracker.blocking_issue_updates table';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.blocking_issue_updates already exists - skipping creation';
    END

    /* =========================================================
       Create indexes
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocking_issue_updates_parent_issue_id' AND object_id = OBJECT_ID('field_tracker.blocking_issue_updates'))
    BEGIN
        CREATE INDEX IX_blocking_issue_updates_parent_issue_id 
            ON field_tracker.blocking_issue_updates(parent_issue_id) 
            WHERE deleted_at IS NULL;
        PRINT 'Created index IX_blocking_issue_updates_parent_issue_id';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocking_issue_updates_created_at' AND object_id = OBJECT_ID('field_tracker.blocking_issue_updates'))
    BEGIN
        CREATE INDEX IX_blocking_issue_updates_created_at 
            ON field_tracker.blocking_issue_updates(created_at DESC);
        PRINT 'Created index IX_blocking_issue_updates_created_at';
    END

    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'field_tracker' 
    AND TABLE_NAME = 'blocking_issue_updates'
    ORDER BY ORDINAL_POSITION;

    PRINT 'Migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;