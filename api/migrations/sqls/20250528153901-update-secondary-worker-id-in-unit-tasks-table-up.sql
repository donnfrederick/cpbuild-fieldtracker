BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.unit_tasks
    ADD CONSTRAINT FK_unit_tasks_secondary_worker
    FOREIGN KEY (secondary_worker_id)
    REFERENCES field_tracker.workers(id);

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
        'AlterWorkHourSubmissionsTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;