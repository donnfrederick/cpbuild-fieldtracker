BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_roles_name' AND object_id = OBJECT_ID('field_tracker.user_roles'))
    BEGIN
        DROP INDEX IX_user_roles_name ON field_tracker.user_roles;
    END

    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'user_roles')
    BEGIN
        DROP TABLE field_tracker.user_roles;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;