BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Drop the trigger 'trg_work_hour_submissions_team_lead_required' if it exists
    IF OBJECT_ID('field_tracker.trg_work_hour_submissions_team_lead_required', 'TR') IS NOT NULL
    BEGIN
        -- Use dynamic SQL to drop the trigger
        EXEC('DROP TRIGGER field_tracker.trg_work_hour_submissions_team_lead_required;');
    END

    -- 2. Commit the transaction if all operations succeed
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
        'CreateTriggerForTeamLeadId_Down_Migration2'
    );

    -- Re-throw the error to notify the calling application
    THROW;
END CATCH;