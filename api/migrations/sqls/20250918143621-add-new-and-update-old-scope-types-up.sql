BEGIN TRANSACTION;

BEGIN TRY
    UPDATE field_tracker.scope_types
    SET sort_order = 18
    WHERE scope_name = 'Broadloom Carpet';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 14
    WHERE scope_name = 'LVP';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 15
    WHERE scope_name = 'LVT';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 16
    WHERE scope_name = 'Tile';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 8
    WHERE scope_name = 'Commercial Door Hardware';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 10
    WHERE scope_name = 'Baseboards';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 19
    WHERE scope_name = 'Epoxy';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 20
    WHERE scope_name = 'Polished Concrete';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 21
    WHERE scope_name = 'Sealed Concrete';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 11
    WHERE scope_name = 'Casings';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 17
    WHERE scope_name = 'Carpet Tile';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 13
    WHERE scope_name = 'Mirrors';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 12
    WHERE scope_name = 'Shelving';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 22
    WHERE scope_name = 'Resilient Athletic Flooring';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 23
    WHERE scope_name = 'Rubber Base';

    INSERT INTO field_tracker.scope_types (scope_name, is_active, created_by, ihi_enabled, sort_order)
    VALUES ('Rough-in Door Frames', 1, 1, 1, 6),
           ('Preset Commercial Doors', 1, 1, 1, 7),
           ('Interior Door Hardware', 1, 1, 1, 9);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'AddNewAndUpdateOldScopeTypes'
    );

    THROW;
END CATCH;