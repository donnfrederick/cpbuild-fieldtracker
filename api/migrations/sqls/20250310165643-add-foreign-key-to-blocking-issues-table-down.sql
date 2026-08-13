BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.blocking_issues
    DROP CONSTRAINT IF EXISTS fk_issue_type_id;

    ALTER TABLE field_tracker.blocking_issues
    DROP CONSTRAINT IF EXISTS fk_responsible_party_id;

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
        'RemoveFKFromBlockingIssues'
    );

    THROW;
END CATCH;
