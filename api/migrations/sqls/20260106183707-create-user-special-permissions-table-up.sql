BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'user_special_permissions')
    BEGIN
        CREATE TABLE field_tracker.user_special_permissions (
            user_id INT NOT NULL,
            can_manage_users BIT NOT NULL DEFAULT 0,
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME2 NULL,
            updated_by INT NULL,
            CONSTRAINT PK_user_special_permissions PRIMARY KEY (user_id),
            CONSTRAINT FK_user_special_permissions_user_id FOREIGN KEY (user_id) REFERENCES dbo.users(id),
            CONSTRAINT FK_user_special_permissions_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id)
        );
        
        PRINT 'Created field_tracker.user_special_permissions table';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.user_special_permissions already exists - skipping creation';
    END

    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'field_tracker' 
    AND TABLE_NAME = 'user_special_permissions'
    ORDER BY ORDINAL_POSITION;

    PRINT 'Migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
END CATCH;