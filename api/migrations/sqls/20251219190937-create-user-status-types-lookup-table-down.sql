BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_user_status_types_name' AND object_id = OBJECT_ID('dbo.user_status_types'))
    BEGIN
        DROP INDEX IX_user_status_types_name ON dbo.user_status_types;
    END

    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'user_status_types')
    BEGIN
        DROP TABLE dbo.user_status_types;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;