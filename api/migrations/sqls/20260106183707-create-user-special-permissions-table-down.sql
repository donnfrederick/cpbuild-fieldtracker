BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'user_special_permissions')
    BEGIN
        DROP TABLE field_tracker.user_special_permissions;
        PRINT 'Dropped table field_tracker.user_special_permissions';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.user_special_permissions does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
END CATCH;