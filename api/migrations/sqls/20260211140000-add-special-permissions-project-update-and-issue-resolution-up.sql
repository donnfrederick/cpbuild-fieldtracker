BEGIN TRANSACTION;

BEGIN TRY
    IF COL_LENGTH('field_tracker.user_special_permissions', 'can_update_all_projects_stage_and_status') IS NULL
    BEGIN
        ALTER TABLE field_tracker.user_special_permissions
        ADD can_update_all_projects_stage_and_status BIT NOT NULL DEFAULT 0;

        PRINT 'Added can_update_all_projects_stage_and_status to field_tracker.user_special_permissions';
    END
    ELSE
    BEGIN
        PRINT 'Column can_update_all_projects_stage_and_status already exists - skipping';
    END

    IF COL_LENGTH('field_tracker.user_special_permissions', 'can_resolve_any_issue') IS NULL
    BEGIN
        ALTER TABLE field_tracker.user_special_permissions
        ADD can_resolve_any_issue BIT NOT NULL DEFAULT 0;

        PRINT 'Added can_resolve_any_issue to field_tracker.user_special_permissions';
    END
    ELSE
    BEGIN
        PRINT 'Column can_resolve_any_issue already exists - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
