BEGIN TRANSACTION;

BEGIN TRY
    -- Remove the Command Center image submission types
    DELETE FROM field_tracker.image_submission_types
    WHERE type_name IN (
        'observation',
        'observation_update',
        'issue',
        'issue_update',
        'issue_resolution'
    );

    PRINT 'Successfully removed Command Center image submission types';

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
        'CommandCenterImageSubmissionTypesAdditionalDataRollback'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;