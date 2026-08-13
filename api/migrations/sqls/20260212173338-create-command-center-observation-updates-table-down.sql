BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_observation_updates')
    BEGIN
        DROP TABLE field_tracker.command_center_observation_updates;
        PRINT 'Dropped table field_tracker.command_center_observation_updates';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observation_updates does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    THROW;
END CATCH;
