BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'identity_provider_types')
    BEGIN
        CREATE TABLE dbo.identity_provider_types (
            id INT IDENTITY(1,1) NOT NULL,
            provider_name NVARCHAR(50) NOT NULL,
            description NVARCHAR(500) NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_identity_provider_types PRIMARY KEY (id),
            CONSTRAINT UQ_identity_provider_types_name UNIQUE (provider_name)
        );
        
        PRINT 'Created dbo.identity_provider_types table';
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.identity_provider_types WHERE provider_name = 'azure_ad')
    BEGIN
        INSERT INTO dbo.identity_provider_types (provider_name, description)
        VALUES ('azure_ad', 'Internal users authenticated via Azure AD federation');
        
        PRINT 'Inserted azure_ad provider';
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.identity_provider_types WHERE provider_name = 'b2c_email')
    BEGIN
        INSERT INTO dbo.identity_provider_types (provider_name, description)
        VALUES ('b2c_email', 'External users authenticated via B2C email/password');
        
        PRINT 'Inserted b2c_email provider';
    END

    SELECT 
        id,
        provider_name,
        description,
        created_at
    FROM dbo.identity_provider_types
    ORDER BY id;

    PRINT 'Migration completed successfully - 2 identity provider types seeded';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;