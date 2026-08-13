BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name = 'user_status_types')
    BEGIN
        CREATE TABLE dbo.user_status_types (
            id INT IDENTITY(1,1) NOT NULL,
            status_name NVARCHAR(50) NOT NULL,
            description NVARCHAR(200) NULL,
            is_active BIT NOT NULL DEFAULT 1,
            sort_order INT NOT NULL,
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_user_status_types PRIMARY KEY (id),
            CONSTRAINT UQ_user_status_types_name UNIQUE (status_name)
        );

        CREATE UNIQUE INDEX IX_user_status_types_name ON dbo.user_status_types(status_name);
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.user_status_types WHERE status_name = 'Active')
    BEGIN
        INSERT INTO dbo.user_status_types (status_name, description, is_active, sort_order)
        VALUES ('Active', 'User can login and access the system', 1, 1);
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.user_status_types WHERE status_name = 'Inactive')
    BEGIN
        INSERT INTO dbo.user_status_types (status_name, description, is_active, sort_order)
        VALUES ('Inactive', 'User temporarily disabled but may return', 1, 2);
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.user_status_types WHERE status_name = 'Terminated')
    BEGIN
        INSERT INTO dbo.user_status_types (status_name, description, is_active, sort_order)
        VALUES ('Terminated', 'User permanently removed from organization', 1, 3);
    END

    SELECT 
        id,
        status_name,
        description,
        is_active,
        sort_order,
        created_at
    FROM dbo.user_status_types
    ORDER BY sort_order;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;