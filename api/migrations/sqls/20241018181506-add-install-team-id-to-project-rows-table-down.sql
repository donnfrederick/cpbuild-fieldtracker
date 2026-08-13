BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the foreign key constraint for install_team_id
    ALTER TABLE field_tracker.project_rows 
    DROP CONSTRAINT fk_install_team_id;

    -- Drop the install_team_id column
    ALTER TABLE field_tracker.project_rows 
    DROP COLUMN install_team_id;

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
        'RemoveInstallTeamIdFromProjectRows_Down'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;