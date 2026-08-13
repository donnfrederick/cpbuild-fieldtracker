BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.workers
    ADD CONSTRAINT uq_workers_user_id UNIQUE (user_id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    -- If any error occurs, rollback the transaction
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error details to the 'error_log' table for debugging
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
        'AddTeamLeadIdToWorkHourSubmissions_Up_Migration1a'
    );

    -- Re-throw the error to notify the calling application
    THROW;
END CATCH;