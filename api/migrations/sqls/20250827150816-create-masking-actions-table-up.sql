BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.masking_actions (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,

        actor_user_id INT NOT NULL,
        CONSTRAINT FK_MaskingActions_Actor FOREIGN KEY (actor_user_id)
            REFERENCES dbo.users (id),

        masked_as_team_lead_id INT NULL,
        CONSTRAINT FK_MaskingActions_TeamLead FOREIGN KEY (masked_as_team_lead_id)
            REFERENCES dbo.users (id),

        action_type VARCHAR(10) NOT NULL, -- insert | update | delete
        entity_table VARCHAR(255) NOT NULL,
        entity_id BIGINT NULL,

        source_tool VARCHAR(100) NOT NULL,
        endpoint VARCHAR(500) NOT NULL,
        request_id VARCHAR(100) NOT NULL,

        payload_snapshot_json NVARCHAR(MAX) NULL,

        created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
    );

    -- Indexes for query performance
    CREATE INDEX IX_MaskingActions_TeamLeadId 
        ON field_tracker.masking_actions (masked_as_team_lead_id);

    CREATE INDEX IX_MaskingActions_ActorId 
        ON field_tracker.masking_actions (actor_user_id);

    CREATE INDEX IX_MaskingActions_Entity 
        ON field_tracker.masking_actions (entity_table, entity_id);

    CREATE INDEX IX_MaskingActions_CreatedAt 
        ON field_tracker.masking_actions (created_at);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error to the error_log table
    INSERT INTO dbo.error_log (
        error_message,
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        user_name,
        app_name
    ) VALUES (
        ERROR_MESSAGE(),
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        SUSER_SNAME(),
        'MaskingActionsTableCreation'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;