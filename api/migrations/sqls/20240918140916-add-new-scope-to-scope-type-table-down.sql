BEGIN TRANSACTION;

BEGIN TRY
    -- Delete the scope with scope_name 'Tile' from dbo.scope_types table
    DELETE FROM field_tracker.scope_types
    WHERE scope_name = 'Tile';

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
        'RemoveTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;