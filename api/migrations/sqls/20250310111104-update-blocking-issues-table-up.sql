BEGIN TRANSACTION;

BEGIN TRY
    -- Add new columns as NULL first
    ALTER TABLE field_tracker.blocking_issues
    ADD 
        issue_type_id INT NULL,
        responsible_party_id INT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'AddColumnsToBlockingIssues'
    );

    THROW;
END CATCH;
