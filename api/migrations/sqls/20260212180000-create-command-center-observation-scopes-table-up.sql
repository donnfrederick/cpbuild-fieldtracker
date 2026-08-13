BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (
        SELECT 1
        FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = 'field_tracker'
          AND t.name = 'command_center_observation_scopes'
    )
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.tables t INNER JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'field_tracker' AND t.name = 'command_center_observations')
           AND EXISTS (SELECT 1 FROM sys.tables t INNER JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'field_tracker' AND t.name = 'scopes')
        BEGIN
            CREATE TABLE field_tracker.command_center_observation_scopes (
                id INT NOT NULL IDENTITY(1,1),
                observation_id INT NOT NULL,
                scope_id INT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT GETDATE(),

                CONSTRAINT PK_command_center_observation_scopes PRIMARY KEY (id),
                CONSTRAINT FK_command_center_observation_scopes_observation
                    FOREIGN KEY (observation_id) REFERENCES field_tracker.command_center_observations(id),
                CONSTRAINT FK_command_center_observation_scopes_scope
                    FOREIGN KEY (scope_id) REFERENCES field_tracker.scopes(id),
                CONSTRAINT UQ_command_center_observation_scopes_observation_scope
                    UNIQUE (observation_id, scope_id)
            );

            CREATE NONCLUSTERED INDEX IX_command_center_observation_scopes_observation_id
                ON field_tracker.command_center_observation_scopes (observation_id);

            CREATE NONCLUSTERED INDEX IX_command_center_observation_scopes_scope_id
                ON field_tracker.command_center_observation_scopes (scope_id);

            PRINT 'Created field_tracker.command_center_observation_scopes table with constraints and indexes';
        END
        ELSE
        BEGIN
            PRINT 'Skipping command_center_observation_scopes: field_tracker.command_center_observations and/or field_tracker.scopes do not exist yet.';
        END
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observation_scopes already exists - skipping creation';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
