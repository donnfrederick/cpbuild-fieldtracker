BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Insert seed data for command_center_status_types
       ========================================================= */
    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_status_types WHERE status_name = 'Not Started')
    BEGIN
        INSERT INTO field_tracker.command_center_status_types (status_name) VALUES ('Not Started');
        PRINT 'Inserted status: Not Started';
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_status_types WHERE status_name = 'In Progress')
    BEGIN
        INSERT INTO field_tracker.command_center_status_types (status_name) VALUES ('In Progress');
        PRINT 'Inserted status: In Progress';
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_status_types WHERE status_name = 'Need Materials')
    BEGIN
        INSERT INTO field_tracker.command_center_status_types (status_name) VALUES ('Need Materials');
        PRINT 'Inserted status: Need Materials';
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_status_types WHERE status_name = 'Blocked')
    BEGIN
        INSERT INTO field_tracker.command_center_status_types (status_name) VALUES ('Blocked');
        PRINT 'Inserted status: Blocked';
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_status_types WHERE status_name = 'Complete')
    BEGIN
        INSERT INTO field_tracker.command_center_status_types (status_name) VALUES ('Complete');
        PRINT 'Inserted status: Complete';
    END

    PRINT 'Seed data migration completed successfully';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;