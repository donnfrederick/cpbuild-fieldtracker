BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Add the 'team_lead_id' column to 'work_hour_submissions' table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'field_tracker'
          AND TABLE_NAME = 'work_hour_submissions'
          AND COLUMN_NAME = 'team_lead_id'
    )
    BEGIN
        -- Use dynamic SQL to add the column
        EXEC('ALTER TABLE field_tracker.work_hour_submissions ADD team_lead_id INT NULL DEFAULT NULL;');
    END

    -- 2. Add a foreign key constraint for 'team_lead_id' referencing 'team_leads(id)' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_work_hour_submissions_team_lead_id'
          AND parent_object_id = OBJECT_ID('field_tracker.work_hour_submissions')
    )
    BEGIN
        -- Use dynamic SQL to add the foreign key constraint
        EXEC('
            ALTER TABLE field_tracker.work_hour_submissions
            ADD CONSTRAINT FK_work_hour_submissions_team_lead_id
                FOREIGN KEY (team_lead_id)
                REFERENCES field_tracker.team_leads(id);
        ');
    END

    -- 3. Commit the transaction if all operations succeed
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