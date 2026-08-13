BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_team_lead_id;

    ALTER TABLE field_tracker.projects_by_scope
    ALTER COLUMN team_lead_id INT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    PRINT 'Error encountered: ' + ERROR_MESSAGE();
END CATCH;