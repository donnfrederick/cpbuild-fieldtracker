BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_command_center_clear_inspection_statuses_name' AND object_id = OBJECT_ID('field_tracker.command_center_clear_inspection_statuses'))
    BEGIN
        DROP INDEX IX_command_center_clear_inspection_statuses_name ON field_tracker.command_center_clear_inspection_statuses;
    END

    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_clear_inspection_statuses')
    BEGIN
        DROP TABLE field_tracker.command_center_clear_inspection_statuses;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;