BEGIN TRANSACTION;

BEGIN TRY
    INSERT INTO field_tracker.scope_types (scope_name, is_active, created_by, ihi_enabled, sort_order)
    VALUES ('Hardwood Flooring', 1, 1, 0, 24),
           ('Laminated Wood Flooring', 1, 1, 0, 25);

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
        'AddNewScopeToScopeTypesTableUpMigration'
    );

    THROW;
END CATCH;