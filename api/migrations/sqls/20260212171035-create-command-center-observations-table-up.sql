BEGIN TRANSACTION;

BEGIN TRY
    -- Create command_center_observations table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_observations')
    BEGIN
        CREATE TABLE field_tracker.command_center_observations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            unit_id INT NOT NULL,
            description NVARCHAR(MAX) NOT NULL,
            created_by INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_at DATETIME NULL
        );

        -- Add foreign key constraints
        ALTER TABLE field_tracker.command_center_observations
        ADD CONSTRAINT FK_command_center_observations_unit_id
        FOREIGN KEY (unit_id) REFERENCES field_tracker.project_rows(id);

        ALTER TABLE field_tracker.command_center_observations
        ADD CONSTRAINT FK_command_center_observations_created_by
        FOREIGN KEY (created_by) REFERENCES dbo.users(id);

        -- Create index on unit_id for active observations (not soft deleted)
        CREATE NONCLUSTERED INDEX IX_command_center_observations_unit_id
        ON field_tracker.command_center_observations (unit_id)
        WHERE deleted_at IS NULL;

        -- Create index on created_at DESC for recent observations
        CREATE NONCLUSTERED INDEX IX_command_center_observations_created_at_desc
        ON field_tracker.command_center_observations (created_at DESC);

        PRINT 'Created field_tracker.command_center_observations table with indexes';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observations already exists - skipping creation';
    END

    -- Display table structure for verification
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'field_tracker' 
    AND TABLE_NAME = 'command_center_observations'
    ORDER BY ORDINAL_POSITION;

    PRINT 'Migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    INSERT INTO dbo.error_log (error_message, created_at)
    VALUES (ERROR_MESSAGE(), GETDATE());

    THROW;
END CATCH;
