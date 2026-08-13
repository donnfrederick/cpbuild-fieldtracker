BEGIN TRANSACTION;

BEGIN TRY
    -- Rename ship_phase column back to phase in the project_rows table
    EXEC sp_rename 'field_tracker.project_rows.ship_phase', 'phase', 'COLUMN';

    -- Assuming you also want to remove the build_phase column added in the up script
    ALTER TABLE field_tracker.project_rows
    DROP COLUMN build_phase;

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
        'ProjectsMigrationDownScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
