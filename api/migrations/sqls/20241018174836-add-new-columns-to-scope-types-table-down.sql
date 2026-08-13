BEGIN TRANSACTION;

BEGIN TRY
    DELETE FROM field_tracker.scope_types
    WHERE scope_name IN (
        'Commercial Door Hardware',
        'Commercial Door Millwork',
        'Epoxy',
        'Polished Concrete',
        'Sealed Concrete',
        'Trim and Millwork',
        'Carpet Tile',
        'Mirrors'
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
        'ModifyScopeTypesTableMigration_Down'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
