BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.blocking_issues
    ADD CONSTRAINT fk_issue_type_id 
        FOREIGN KEY (issue_type_id) REFERENCES field_tracker.blocking_issue_types(id);

    ALTER TABLE field_tracker.blocking_issues
    ADD CONSTRAINT fk_responsible_party_id 
        FOREIGN KEY (responsible_party_id) REFERENCES field_tracker.blocking_issue_responsible_party_types(id);

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
        'AddFKToBlockingIssues'
    );

    THROW;
END CATCH;
