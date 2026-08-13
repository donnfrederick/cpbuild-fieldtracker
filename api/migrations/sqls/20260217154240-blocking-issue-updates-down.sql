BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Drop indexes for blocking_issue_updates table
       ========================================================= */
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocking_issue_updates_created_at' AND object_id = OBJECT_ID('field_tracker.blocking_issue_updates'))
    BEGIN
        DROP INDEX IX_blocking_issue_updates_created_at ON field_tracker.blocking_issue_updates;
        PRINT 'Dropped index IX_blocking_issue_updates_created_at';
    END

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocking_issue_updates_parent_issue_id' AND object_id = OBJECT_ID('field_tracker.blocking_issue_updates'))
    BEGIN
        DROP INDEX IX_blocking_issue_updates_parent_issue_id ON field_tracker.blocking_issue_updates;
        PRINT 'Dropped index IX_blocking_issue_updates_parent_issue_id';
    END

    /* =========================================================
       Drop blocking_issue_updates table
       ========================================================= */
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'blocking_issue_updates')
    BEGIN
        DROP TABLE field_tracker.blocking_issue_updates;
        PRINT 'Dropped table field_tracker.blocking_issue_updates';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.blocking_issue_updates does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;