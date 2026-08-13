BEGIN TRANSACTION;

BEGIN TRY
    -- Populate existing records with default values
    UPDATE field_tracker.blocking_issues
    SET 
        issue_type_id = 1,
        responsible_party_id = 1;

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
        'UpdateBlockingIssuesDefaultValues'
    );

    THROW;
END CATCH;
