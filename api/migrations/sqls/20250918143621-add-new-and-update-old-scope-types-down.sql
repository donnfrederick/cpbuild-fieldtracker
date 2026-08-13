BEGIN TRANSACTION;

BEGIN TRY
    UPDATE field_tracker.scope_types
    SET sort_order = 15
    WHERE scope_name = 'Broadloom Carpet';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 11
    WHERE scope_name = 'LVP';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 12
    WHERE scope_name = 'LVT';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 13
    WHERE scope_name = 'Tile';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 6
    WHERE scope_name = 'Commercial Door Hardware';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 7
    WHERE scope_name = 'Baseboards';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 16
    WHERE scope_name = 'Epoxy';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 17
    WHERE scope_name = 'Polished Concrete';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 18
    WHERE scope_name = 'Sealed Concrete';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 8
    WHERE scope_name = 'Casings';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 10
    WHERE scope_name = 'Carpet Tile';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 4
    WHERE scope_name = 'Mirrors';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 9
    WHERE scope_name = 'Shelving';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 19
    WHERE scope_name = 'Resilient Athletic Flooring';
    
    UPDATE field_tracker.scope_types
    SET sort_order = 20
    WHERE scope_name = 'Rubber Base';

    DELETE FROM field_tracker.scope_types
    WHERE scope_name IN (
        'Rough-in Door Frames',
        'Preset Commercial Doors',
        'Interior Door Hardware'
    );

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