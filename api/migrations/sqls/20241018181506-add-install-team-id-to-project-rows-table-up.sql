BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.project_rows 
    ADD install_team_id INT NULL DEFAULT NULL;

    ALTER TABLE field_tracker.project_rows 
    ADD CONSTRAINT fk_install_team_id FOREIGN KEY (install_team_id) REFERENCES field_tracker.install_teams(id);

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
        'AddInstallTeamIdToProjectRows_Up'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;