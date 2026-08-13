BEGIN TRANSACTION;

BEGIN TRY
    IF COL_LENGTH('field_tracker.user_special_permissions', 'can_resolve_any_issue') IS NOT NULL
    BEGIN
        ALTER TABLE field_tracker.user_special_permissions
        DROP COLUMN can_resolve_any_issue;

        PRINT 'Dropped can_resolve_any_issue from field_tracker.user_special_permissions';
    END
    ELSE
    BEGIN
        PRINT 'Column can_resolve_any_issue does not exist - skipping';
    END

    IF COL_LENGTH('field_tracker.user_special_permissions', 'can_update_all_projects_stage_and_status') IS NOT NULL
    BEGIN
        ALTER TABLE field_tracker.user_special_permissions
        DROP COLUMN can_update_all_projects_stage_and_status;

        PRINT 'Dropped can_update_all_projects_stage_and_status from field_tracker.user_special_permissions';
    END
    ELSE
    BEGIN
        PRINT 'Column can_update_all_projects_stage_and_status does not exist - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
