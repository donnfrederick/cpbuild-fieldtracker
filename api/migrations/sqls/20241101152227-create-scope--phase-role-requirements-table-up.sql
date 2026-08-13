BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.scope_phases_role_requirements (
        id INT PRIMARY KEY IDENTITY(1,1),
        phase_id INT NOT NULL,
        worker_role_type_id INT NOT NULL,
        CONSTRAINT FK_ScopePhasesRoleReq_PhaseID FOREIGN KEY (phase_id)
            REFERENCES field_tracker.unit_phases_by_scope(id)
            ON DELETE CASCADE,
        CONSTRAINT FK_ScopePhasesRoleReq_WorkerRoleTypeID FOREIGN KEY (worker_role_type_id)
            REFERENCES field_tracker.worker_role_types(id)
            ON DELETE CASCADE
    );

    INSERT INTO field_tracker.scope_phases_role_requirements (phase_id, worker_role_type_id)
    VALUES
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry') 
            AND phase_name = 'Assembly'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Assembler' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry') 
            AND phase_name = 'Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Installer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') 
            AND phase_name = 'Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Installer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') 
            AND phase_name = 'Prehung Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') 
            AND phase_name = 'Prehung Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') 
            AND phase_name = 'Prehung Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') 
            AND phase_name = 'Prehung Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') 
            AND phase_name = 'Millwork Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') 
            AND phase_name = 'Millwork Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') 
            AND phase_name = 'Frame Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') 
            AND phase_name = 'Frame Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') 
            AND phase_name = 'Door Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') 
            AND phase_name = 'Door Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') 
            AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') 
            AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') 
            AND phase_name = 'Seal, Sweep, & Threshold Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') 
            AND phase_name = 'Seal, Sweep, & Threshold Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') 
            AND phase_name = 'Baseboard Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') 
            AND phase_name = 'Baseboard Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') 
            AND phase_name = 'Baseboard Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings') 
            AND phase_name = 'Casing Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings') 
            AND phase_name = 'Casing Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings') 
            AND phase_name = 'Casing Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') 
            AND phase_name = 'Shelving Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') 
            AND phase_name = 'Shelving Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Apprentice' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'))
        ),
        (
            (SELECT TOP 1 id 
            FROM field_tracker.unit_phases_by_scope 
            WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') 
            AND phase_name = 'Shelving Install'),
            
            (SELECT TOP 1 id 
            FROM field_tracker.worker_role_types 
            WHERE role_type_name = 'Skilled Laborer' 
            AND scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'))
        );


    COMMIT TRANSACTION;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
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
        'scopePhasesRoleRequirementsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
