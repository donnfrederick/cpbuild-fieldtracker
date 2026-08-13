BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Revert 'team_lead_id' back to NULL where it was set to 1 by Migration 1b
    EXEC('
        UPDATE fhs
        SET team_lead_id = NULL
        FROM field_tracker.work_hour_submissions fhs
        INNER JOIN field_tracker.work_hour_submission_types whst ON fhs.submit_type_id = whst.id
        INNER JOIN field_tracker.work_pay_types wpt ON whst.pay_type_id = wpt.id
        WHERE wpt.type_name = ''Quantity'' AND fhs.team_lead_id = 1;
    ');

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
        'UpdateTeamLeadIdMigration1b_Down'
    );

    -- Re-throw the error to notify the calling application
    THROW;
END CATCH;