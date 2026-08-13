BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Create command_center_status_types table
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_status_types')
    BEGIN
        CREATE TABLE field_tracker.command_center_status_types (
            id INT IDENTITY(1,1) NOT NULL,
            status_name NVARCHAR(100) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_command_center_status_types PRIMARY KEY (id),
            CONSTRAINT UQ_command_center_status_types_status_name UNIQUE (status_name)
        );
        
        PRINT 'Created field_tracker.command_center_status_types table';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_status_types already exists - skipping creation';
    END

    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'field_tracker' 
    AND TABLE_NAME = 'command_center_status_types'
    ORDER BY ORDINAL_POSITION;

    PRINT 'Migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;