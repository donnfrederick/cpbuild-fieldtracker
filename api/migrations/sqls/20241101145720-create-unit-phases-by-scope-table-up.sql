BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.unit_phases_by_scope (
        id INT PRIMARY KEY IDENTITY(1,1),
        phase_name NVARCHAR(255) NOT NULL,
        scope_type_id INT NOT NULL,
        phase_order INT NOT NULL,
        version INT DEFAULT 1,
        main_task_required BIT NOT NULL,
        worker_assignment_required BIT NOT NULL,
        worker_assignment_display_name NVARCHAR(255),
        has_checklist_items BIT NOT NULL,
        image_acknowledgment_text NVARCHAR(1000),
        scheduling_required BIT NOT NULL,
        incremental_weight_percent DECIMAL(10, 4) NOT NULL,
        initial_cumulative_percent DECIMAL(10, 4) NOT NULL,
        final_cumulative_percent DECIMAL(10, 4) NOT NULL,
        description NVARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL,
        CONSTRAINT uq_phase_name_scope_type UNIQUE (phase_name, scope_type_id),
        CONSTRAINT uq_phase_order_scope_type UNIQUE (phase_order, scope_type_id),
        CONSTRAINT fk_scope_type FOREIGN KEY (scope_type_id) REFERENCES field_tracker.scope_types(id),
        CONSTRAINT chk_worker_assignment_required CHECK (
            worker_assignment_required = 0 OR worker_assignment_display_name IS NOT NULL
        ),
        CONSTRAINT chk_has_checklist_items CHECK (
            has_checklist_items = 0 OR image_acknowledgment_text IS NOT NULL
        )
    );

    INSERT INTO field_tracker.unit_phases_by_scope (
        phase_name, scope_type_id, phase_order, version, main_task_required, 
        worker_assignment_required, worker_assignment_display_name, has_checklist_items, 
        image_acknowledgment_text, scheduling_required, incremental_weight_percent, 
        initial_cumulative_percent, final_cumulative_percent, created_by
    ) VALUES
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'), 1, 1, 0, 0, null, 0, null, 0, 5, 0, 5, 1),
        ('Assembly', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'), 2, 1, 1, 1, 'Assembler', 0, null, 1, 35, 5, 40, 1),
        ('Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'), 3, 1, 1, 1, 'Installer', 1, 'I acknowledge that I uploaded photos of each elevation.', 1, 55, 40, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'), 4, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry'), 5, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops'), 1, 1, 0, 0, null, 0, null, 0, 5, 0, 5, 1),
        ('Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops'), 2, 1, 1, 1, 'Installer', 1, 'I acknowledge that I uploaded photos of each elevation, as well as seams and sinks if installed.', 1, 90, 5, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed units, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Prehung Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'), 2, 1, 1, 1, 'Prehung Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 55, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Prehung Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'), 2, 1, 1, 1, 'Prehung Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 45, 25, 70, 1),
        ('Millwork Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'), 3, 1, 1, 1, 'Millwork Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 25, 70, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'), 4, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors'), 5, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Frame Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'), 2, 1, 1, 1, 'Frame Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 45, 25, 70, 1),
        ('Door Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'), 3, 1, 1, 1, 'Door Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 25, 70, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'), 4, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors'), 5, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Hinge, Lock, & Wallstop Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'), 2, 1, 1, 1, 'Hing, Lock, & Wallstop Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 25, 25, 50, 1),
        ('Seal, Sweep, & Threshold Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'), 3, 1, 1, 1, 'Weather, Gasket, & Threshold Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 45, 50, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'), 4, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware'), 5, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Baseboard Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'), 2, 1, 1, 1, 'Baseboard Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 70, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Casing Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'), 2, 1, 1, 1, 'Casing Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 70, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Shelving Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'), 2, 1, 1, 1, 'Shelving Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 70, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1)

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
        'projectsByScopeMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;