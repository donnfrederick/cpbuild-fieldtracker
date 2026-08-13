BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (
        SELECT 1
        FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = 'field_tracker'
          AND t.name = 'command_center_observation_scopes'
    )
    BEGIN
        DROP TABLE field_tracker.command_center_observation_scopes;
        PRINT 'Dropped table field_tracker.command_center_observation_scopes';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observation_scopes does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
