BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.install_teams
    ADD CONSTRAINT UQ_install_teams
    UNIQUE (team_name);

    UPDATE field_tracker.install_teams
    SET team_name = 'IHI Team'
    WHERE id = 1;

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
        'AddUniqueConstraintMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
