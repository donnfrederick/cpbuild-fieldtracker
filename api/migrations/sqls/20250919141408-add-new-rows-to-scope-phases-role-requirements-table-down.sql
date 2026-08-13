BEGIN TRANSACTION;

BEGIN TRY
    DELETE sprr
    FROM field_tracker.scope_phases_role_requirements sprr
    WHERE 
        (sprr.phase_id = (
            SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
            AND phase_name = 'Frame Install'
        ) AND sprr.worker_role_type_id IN (11, 10))
        
        OR
        (sprr.phase_id = (
            SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
            AND phase_name = 'Door Install'
        ) AND sprr.worker_role_type_id IN (11, 10))
        
        OR
        (sprr.phase_id = (
            SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
            AND phase_name = 'Hinge, Lock, & Wallstop Install'
        ) AND sprr.worker_role_type_id IN (14, 13))
        
        OR
        (sprr.phase_id = (
            SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
            AND phase_name = 'Seal, Sweep, & Threshold Install'
        ) AND sprr.worker_role_type_id IN (14, 13));

    COMMIT TRANSACTION;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
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
        'AddNewColumnsToScopePhasesRoleRequirementsTableDownScript'
    );
    THROW;
END CATCH;
