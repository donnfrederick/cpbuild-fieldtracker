BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Insert new image submission types for Command Center
       observations and issues (idempotent)
       ========================================================= */
    INSERT INTO field_tracker.image_submission_types (type_name, description)
    SELECT v.type_name, v.description
    FROM (VALUES
        ('observation', 'Photo on initial observation'),
        ('observation_update', 'Photo on observation update/comment'),
        ('issue', 'Photo when reporting issue (blocking or non-blocking)'),
        ('issue_update', 'Photo on issue update/comment'),
        ('issue_resolution', 'Photo when resolving issue')
    ) AS v(type_name, description)
    WHERE NOT EXISTS (
        SELECT 1
        FROM field_tracker.image_submission_types ist
        WHERE ist.type_name = v.type_name
    );

    PRINT 'Successfully inserted additional image submission types for Command Center';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

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
        'CommandCenterImageSubmissionTypesAdditionalData'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;