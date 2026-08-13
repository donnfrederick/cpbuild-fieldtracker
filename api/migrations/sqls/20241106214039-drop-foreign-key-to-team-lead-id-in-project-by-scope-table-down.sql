BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.projects_by_scope
    ALTER COLUMN team_lead_id INT NOT NULL;

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_team_lead_id
    FOREIGN KEY (team_lead_id)
    REFERENCES field_tracker.team_leads (id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    PRINT 'Error encountered: ' + ERROR_MESSAGE();
END CATCH;