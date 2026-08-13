BEGIN TRANSACTION;

BEGIN TRY
    INSERT INTO field_tracker.unit_phases_by_scope (
        phase_name, scope_type_id, phase_order, version, main_task_required, 
        worker_assignment_required, worker_assignment_display_name, has_checklist_items, 
        image_acknowledgment_text, scheduling_required, incremental_weight_percent, 
        initial_cumulative_percent, final_cumulative_percent, created_by
    ) VALUES
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Frame Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames'), 2, 1, 1, 1, 'Frame Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 70, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames'), 3, 1, 1, 0, null, 0, 'I acknowledge that I uploaded photos of completed unit, as well as any deficiencies found during inspection with a description.', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Door Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors'), 2, 1, 1, 1, 'Door Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 70, 25, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors'), 3, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed units, as well as any deficiencies found during inspection with a description.', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors'), 4, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1),
        ('Staging', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware'), 1, 1, 0, 0, null, 0, null, 0, 25, 0, 25, 1),
        ('Hinge, Lock, & Wallstop Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware'), 2, 1, 1, 1, 'Hinge, Lock, & Wallstop Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 25, 25, 50, 1),
        ('Seal, Sweep, & Threshold Install', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware'), 3, 1, 1, 1, 'Weather, Gasket, & Threshold Installer', 1, 'I acknowledge that I have uploaded at least one image that demonstrates this task was completed fully and in accordance with established quality standards.', 1, 45, 50, 95, 1),
        ('Clear Inspection', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware'), 4, 1, 1, 0, null, 1, 'I acknowledge that I uploaded photos of completed units, as well as any deficiencies found during inspection with a description.', 0, 5, 95, 100, 1),
        ('Complete', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware'), 5, 1, 0, 0, null, 0, null, 0, 0, 100, 100, 1);
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
        'AddNewColumnsToUnitPhasesByScopeTableUp'
    );
    THROW;
END CATCH;