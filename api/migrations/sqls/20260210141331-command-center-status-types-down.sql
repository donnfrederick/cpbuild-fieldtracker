BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Drop command_center_status_types table
       ========================================================= */
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_status_types')
    BEGIN
        DROP TABLE field_tracker.command_center_status_types;
        PRINT 'Dropped table field_tracker.command_center_status_types';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_status_types does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;