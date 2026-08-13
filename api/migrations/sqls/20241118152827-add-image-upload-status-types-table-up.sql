BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.image_upload_status_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        status_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.image_upload_status_types (status_name, description)
    VALUES
        ('pending', 'The image has been uploaded but is not yet linked to a specific submission or db table.'),
        ('linked', 'The image has been linked to a specific submission or context.'),
        ('orphaned', 'The image is no longer associated with a valid session or submission and may be marked for deletion.'),
        ('user_deleted', 'The image has been removed from storage and the database, but a record is kept for auditing purposes.');

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