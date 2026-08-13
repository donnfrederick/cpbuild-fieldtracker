BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Insert initial stage weights for Command Center workflow
       ========================================================= */
    INSERT INTO field_tracker.command_center_stage_weights (stage_id, stage_name, weight_percentage) VALUES
        (1, 'Staging', 20),
        (2, 'Assembly', 50),
        (3, 'Install', 100);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;