BEGIN TRANSACTION;

BEGIN TRY
    INSERT INTO field_tracker.scope_types (scope_name, is_active, ihi_enabled)
    VALUES 
        ('Commercial Door Hardware', 1, 1),
        ('Commercial Door Millwork', 1, 1),
        ('Epoxy', 1, 0),
        ('Polished Concrete', 1, 0),
        ('Sealed Concrete', 1, 0),
        ('Trim and Millwork', 1, 0),
        ('Carpet Tile', 1, 0),
        ('Mirrors', 1, 0);

    UPDATE field_tracker.scope_types
    SET ihi_enabled = 1
    WHERE scope_name = 'Cabinetry';

    UPDATE field_tracker.scope_types
    SET ihi_enabled = 1
    WHERE scope_name = 'Countertops';

    UPDATE field_tracker.scope_types
    SET ihi_enabled = 1
    WHERE scope_name = 'Residential Doors';

    UPDATE field_tracker.scope_types
    SET ihi_enabled = 1
    WHERE scope_name = 'Commercial Doors';

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
        'ModifyProjectsTableMigration_Up'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;