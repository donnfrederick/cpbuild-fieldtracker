BEGIN TRANSACTION;

BEGIN TRY
    -- Drop indexes first
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_command_center_clear_inspections_status_unit' AND object_id = OBJECT_ID('field_tracker.command_center_clear_inspections'))
    BEGIN
        DROP INDEX IX_command_center_clear_inspections_status_unit ON field_tracker.command_center_clear_inspections;
    END

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_command_center_clear_inspections_unit_by_scope_id' AND object_id = OBJECT_ID('field_tracker.command_center_clear_inspections'))
    BEGIN
        DROP INDEX UQ_command_center_clear_inspections_unit_by_scope_id ON field_tracker.command_center_clear_inspections;
    END

    -- Drop the table
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_clear_inspections')
    BEGIN
        DROP TABLE field_tracker.command_center_clear_inspections;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;