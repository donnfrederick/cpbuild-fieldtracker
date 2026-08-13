BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Drop filtered index on b2c_object_id
       ========================================================= */
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_users_b2c_object_id'
          AND object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        DROP INDEX IX_users_b2c_object_id ON dbo.users;
    END

    /* =========================================================
       Drop index on identity_provider_id
       ========================================================= */
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_users_identity_provider_id'
          AND object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        DROP INDEX IX_users_identity_provider_id ON dbo.users;
    END

    /* =========================================================
       Drop FK constraint
       ========================================================= */
    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_users_identity_provider_types'
          AND parent_object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        ALTER TABLE dbo.users
        DROP CONSTRAINT FK_users_identity_provider_types;
    END

    /* =========================================================
       Make identity_provider_id nullable (if exists)
       ========================================================= */
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.users')
          AND name = 'identity_provider_id'
          AND is_nullable = 0
    )
    BEGIN
        ALTER TABLE dbo.users
        ALTER COLUMN identity_provider_id INT NULL;
    END

    /* =========================================================
       Drop b2c_object_id column
       ========================================================= */
    IF COL_LENGTH('dbo.users', 'b2c_object_id') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.users
        DROP COLUMN b2c_object_id;
    END

    /* =========================================================
       Drop identity_provider_id column
       ========================================================= */
    IF COL_LENGTH('dbo.users', 'identity_provider_id') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.users
        DROP COLUMN identity_provider_id;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
