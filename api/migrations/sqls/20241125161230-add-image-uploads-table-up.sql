BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.image_uploads (
        id INT IDENTITY(1,1) PRIMARY KEY,
        submission_type_id INT NOT NULL,
        CONSTRAINT FK_ImageUploads_SubmissionType FOREIGN KEY (submission_type_id)
            REFERENCES field_tracker.image_submission_types (id),
        submission_location VARCHAR(255) NOT NULL,
        submission_id INT NULL,
        session_id VARCHAR(255) NOT NULL,
        upload_status_id INT NOT NULL,
        CONSTRAINT FK_ImageUploads_UploadStatus FOREIGN KEY (upload_status_id)
            REFERENCES field_tracker.image_upload_status_types (id),
        file_url VARCHAR(255) NOT NULL,
        thumbnail_url VARCHAR(255) NULL,
        file_name VARCHAR(255) NOT NULL,
        image_name VARCHAR(255) NULL,
        image_description TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL
    );

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