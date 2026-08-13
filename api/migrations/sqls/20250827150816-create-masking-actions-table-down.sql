BEGIN TRANSACTION;

BEGIN TRY
    -- Drop indexes first (SQL Server requires dropping dependent objects before table)
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MaskingActions_TeamLeadId' AND object_id = OBJECT_ID('field_tracker.masking_actions'))
        DROP INDEX IX_MaskingActions_TeamLeadId ON field_tracker.masking_actions;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MaskingActions_ActorId' AND object_id = OBJECT_ID('field_tracker.masking_actions'))
        DROP INDEX IX_MaskingActions_ActorId ON field_tracker.masking_actions;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MaskingActions_Entity' AND object_id = OBJECT_ID('field_tracker.masking_actions'))
        DROP INDEX IX_MaskingActions_Entity ON field_tracker.masking_actions;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MaskingActions_CreatedAt' AND object_id = OBJECT_ID('field_tracker.masking_actions'))
        DROP INDEX IX_MaskingActions_CreatedAt ON field_tracker.masking_actions;

    -- Drop the table if it exists
    IF OBJECT_ID('field_tracker.masking_actions', 'U') IS NOT NULL
        DROP TABLE field_tracker.masking_actions;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'MaskingActionsTableDrop'
    );

    THROW;
END CATCH;
