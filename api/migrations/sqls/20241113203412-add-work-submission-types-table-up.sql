BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.work_hour_submission_types (
        id INT PRIMARY KEY IDENTITY(1,1),
        type_name NVARCHAR(255) NOT NULL,
        task_type_id INT NULL,
        phase_id INT NULL,
        pay_type_id INT NOT NULL,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_TaskType FOREIGN KEY (task_type_id) REFERENCES field_tracker.task_types(id),
        CONSTRAINT FK_PhaseType FOREIGN KEY (phase_id) REFERENCES field_tracker.unit_phases_by_scope(id),
        CONSTRAINT FK_PayType FOREIGN KEY (pay_type_id) REFERENCES field_tracker.work_pay_types(id)
    );

    INSERT INTO field_tracker.work_hour_submission_types (type_name, task_type_id, phase_id, pay_type_id)
    VALUES
        (
            'Staging',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'staging'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Offloading',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'offloading'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Training',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'training'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Meeting',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'meeting'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Punch Work',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'punch work'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Not Payable')
        ),
        
        (
            'Modification',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'modification'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Trade Damage Repair',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'trade damage repair'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Forklift Operation',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'forklift operation'),
            NULL, 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Hourly')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'assembly' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),

        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'assembly' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'countertops')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'countertops')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential interior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential interior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential exterior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential exterior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential exterior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Prehung Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'residential exterior prehung doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Frame Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'commercial doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Frame Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'commercial doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Door Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'commercial doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Door Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'commercial doors')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Hinge, Lock, & Wallstop Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Hinge, Lock, & Wallstop Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Seal, Sweep, & Threshold Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Seal, Sweep, & Threshold Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Baseboard Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Baseboard Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Casing Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Casing Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Planned Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Shelving Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
        ),
        
        (
            'Added Quantity',
            (SELECT id FROM field_tracker.task_types WHERE type_name = 'Main'), 
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE phase_name = 'Shelving Install' AND scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving')), 
            (SELECT id FROM field_tracker.work_pay_types WHERE type_name = 'Quantity')
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
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;