BEGIN TRANSACTION;

BEGIN TRY
    -- Create command_center_observation_updates table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_observation_updates')
    BEGIN
        CREATE TABLE field_tracker.command_center_observation_updates (
            id INT IDENTITY(1,1) PRIMARY KEY,
            parent_observation_id INT NOT NULL,
            update_text NVARCHAR(MAX) NOT NULL,
            created_by INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_at DATETIME NULL
        );

        -- Add foreign key constraints
        ALTER TABLE field_tracker.command_center_observation_updates
        ADD CONSTRAINT FK_command_center_observation_updates_parent_observation_id
        FOREIGN KEY (parent_observation_id) REFERENCES field_tracker.command_center_observations(id);

        ALTER TABLE field_tracker.command_center_observation_updates
        ADD CONSTRAINT FK_command_center_observation_updates_created_by
        FOREIGN KEY (created_by) REFERENCES dbo.users(id);

        -- Create index on parent_observation_id for active updates (not soft deleted)
        CREATE NONCLUSTERED INDEX IX_command_center_observation_updates_parent_observation_id
        ON field_tracker.command_center_observation_updates (parent_observation_id)
        WHERE deleted_at IS NULL;

        -- Create index on created_at DESC for recent updates
        CREATE NONCLUSTERED INDEX IX_command_center_observation_updates_created_at_desc
        ON field_tracker.command_center_observation_updates (created_at DESC);

        PRINT 'Created field_tracker.command_center_observation_updates table with indexes';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observation_updates already exists - skipping creation';
    END

    -- Display table structure for verification
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'field_tracker' 
    AND TABLE_NAME = 'command_center_observation_updates'
    ORDER BY ORDINAL_POSITION;

    PRINT 'Migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    THROW;
END CATCH;
