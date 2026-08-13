BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Delete initial stage weights for Command Center workflow
       ========================================================= */
    DELETE FROM field_tracker.command_center_stage_weights;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;