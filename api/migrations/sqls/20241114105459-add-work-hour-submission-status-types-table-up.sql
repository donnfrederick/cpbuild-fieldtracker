BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.work_hour_submission_status_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        status_name NVARCHAR(255) NOT NULL,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.work_hour_submission_status_types (status_name, description, is_active)
    VALUES
        ('Submitted', NULL, 1),
        ('Approved', NULL, 1),
        ('Rejected', NULL, 1),
        ('Deleted', NULL, 1);

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
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;