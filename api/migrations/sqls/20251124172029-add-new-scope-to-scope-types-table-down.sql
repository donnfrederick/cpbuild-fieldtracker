BEGIN TRANSACTION;

BEGIN TRY
    DELETE FROM field_tracker.scope_types
    WHERE scope_name IN (
        'Hardwood Flooring',
        'Laminated Wood Flooring'
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    INSERT INTO dbo.error_log (
        error_message,
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        user_name,
        app_name
    )
    VALUES (
        ERROR_MESSAGE(),
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        SUSER_SNAME(),
        'AddNewScopeToScopeTypesTableDownMigration'
    );

    THROW;
END CATCH;