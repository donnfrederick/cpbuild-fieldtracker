BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Delete only the status types seeded by this migration
       to ensure safe rollback
       ========================================================= */
    DELETE FROM field_tracker.command_center_status_types 
    WHERE status_name IN ('Not Started', 'In Progress', 'Need Materials', 'Blocked', 'Complete');
    
    PRINT 'Deleted seed data from field_tracker.command_center_status_types';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;