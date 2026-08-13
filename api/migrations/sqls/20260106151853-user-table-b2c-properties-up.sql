BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Resolve Azure AD provider ID
       ========================================================= */
    DECLARE @AzureAdProviderId INT;

    SELECT @AzureAdProviderId = id
    FROM dbo.identity_provider_types
    WHERE provider_name = 'azure_ad';

    IF @AzureAdProviderId IS NULL
        THROW 50001, 'Azure AD provider not found.', 1;

    /* =========================================================
       Add identity_provider_id (nullable first)
       ========================================================= */
    IF COL_LENGTH('dbo.users', 'identity_provider_id') IS NULL
    BEGIN
        ALTER TABLE dbo.users
        ADD identity_provider_id INT NULL;
    END

    /* =========================================================
       Backfill users (dynamic SQL)
       ========================================================= */
    DECLARE @sql NVARCHAR(MAX);

    SET @sql = N'
        UPDATE dbo.users
        SET identity_provider_id = @ProviderId
        WHERE identity_provider_id IS NULL;
    ';

    EXEC sp_executesql
        @sql,
        N'@ProviderId INT',
        @ProviderId = @AzureAdProviderId;

    /* =========================================================
       Enforce NOT NULL
       ========================================================= */
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.users')
          AND name = 'identity_provider_id'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.users
        ALTER COLUMN identity_provider_id INT NOT NULL;
    END

    /* =========================================================
       Add FK
       ========================================================= */
    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_users_identity_provider_types'
          AND parent_object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        ALTER TABLE dbo.users
        ADD CONSTRAINT FK_users_identity_provider_types
            FOREIGN KEY (identity_provider_id)
            REFERENCES dbo.identity_provider_types(id);
    END

    /* =========================================================
       Add b2c_object_id
       ========================================================= */
    IF COL_LENGTH('dbo.users', 'b2c_object_id') IS NULL
    BEGIN
        ALTER TABLE dbo.users
        ADD b2c_object_id NVARCHAR(255) NULL;
    END

    /* =========================================================
       Index: identity_provider_id (safe now)
       ========================================================= */
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_users_identity_provider_id'
          AND object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_users_identity_provider_id
        ON dbo.users (identity_provider_id);
    END

    /* =========================================================
       Index: b2c_object_id (MUST be dynamic)
       ========================================================= */
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_users_b2c_object_id'
          AND object_id = OBJECT_ID('dbo.users')
    )
    BEGIN
        SET @sql = N'
            CREATE NONCLUSTERED INDEX IX_users_b2c_object_id
            ON dbo.users (b2c_object_id)
            WHERE b2c_object_id IS NOT NULL;
        ';
        EXEC (@sql);
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
