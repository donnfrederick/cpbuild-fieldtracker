BEGIN TRANSACTION;

BEGIN TRY
    -- Alter project_rows table to adjust phase column to be called ship_phase and add build_phase column
    EXEC sp_rename 'field_tracker.project_rows.phase', 'ship_phase', 'COLUMN';

    ALTER TABLE field_tracker.project_rows
    ADD build_phase VARCHAR(255);

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
        'ProjectRowsPhaseColumnsAdjustScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;