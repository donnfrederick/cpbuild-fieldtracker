BEGIN TRANSACTION;

BEGIN TRY
    DELETE FROM field_tracker.unit_phases_by_scope
    WHERE scope_type_id IN (
        SELECT id 
        FROM field_tracker.scope_types 
        WHERE scope_name IN (
            'Rough-in Door Frames',
            'Preset Commercial Doors',
            'Interior Door Hardware'
        )
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
        'DropNewColumnsToUnitPhasesByScopeTableUp'
    );
    THROW;
END CATCH;