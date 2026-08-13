BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Create the trigger 'trg_work_hour_submissions_team_lead_required' if it doesn't exist
    IF OBJECT_ID('field_tracker.trg_work_hour_submissions_team_lead_required', 'TR') IS NULL
    BEGIN
        -- Use dynamic SQL to create the trigger
        EXEC('
            CREATE TRIGGER field_tracker.trg_work_hour_submissions_team_lead_required
            ON field_tracker.work_hour_submissions
            AFTER INSERT, UPDATE
            AS
            BEGIN
                SET NOCOUNT ON;

                -- Check for any inserted or updated rows where:
                -- - The associated pay_type has type_name = ''Quantity''
                -- - The team_lead_id is NULL
                IF EXISTS (
                    SELECT 1
                    FROM inserted i
                    INNER JOIN field_tracker.work_hour_submission_types whst ON i.submit_type_id = whst.id
                    INNER JOIN field_tracker.work_pay_types wpt ON whst.pay_type_id = wpt.id
                    WHERE wpt.type_name = ''Quantity'' AND i.team_lead_id IS NULL
                )
                BEGIN
                    -- Raise an error to prevent the operation
                    RAISERROR(''team_lead_id is required when pay_type_id type_name is "Quantity".'', 16, 1);

                    -- Rollback the transaction to undo the INSERT or UPDATE
                    ROLLBACK TRANSACTION;

                    -- Exit the trigger
                    RETURN;
                END
            END;
        ');
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
        'CreateTriggerForTeamLeadId_Up_Migration2'
    );

    -- Re-throw the error to notify the calling application
    THROW;
END CATCH;