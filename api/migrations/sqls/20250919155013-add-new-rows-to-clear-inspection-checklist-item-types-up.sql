BEGIN TRANSACTION;

BEGIN TRY
    INSERT INTO field_tracker.clear_inspection_checklist_item_types (
        item_name,
        description,
        phase_id,
        sort_order,
        version,
        is_required,
        is_active
    )
    VALUES
    -- Rough-in Door Frames - FRAME INSTALL
    ('1.1 LAYOUT', 'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 1, 1, 1, 1),
    ('1.2 FUNCTION', 'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 2, 1, 1, 1),
    ('1.3 FRAME', 'Door(s) Frame, Jamb, Snap-on Casing, Set screws, Etc. are installed complete. DR header Joints are tight and all nails/screws are set.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 3, 1, 1, 1),
    ('1.4 HINGES', 'All hinge screws and pins are installed and flush with door jamb substrate.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 4, 1, 1, 1),
    ('1.5 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 5, 1, 1, 1),
    ('1.6 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Frame Install'), 6, 1, 1, 1),

    -- Rough-in Door Frames - CLEAR INSPECTION
    ('1.1 LAYOUT', 'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 1, 1, 1, 1),
    ('1.2 FUNCTION', 'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 2, 1, 1, 1),
    ('1.3 FRAME', 'Door(s) Frame, Jamb, Snap-on Casing, Set screws, Etc. are installed complete. DR header Joints are tight and all nails/screws are set.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 3, 1, 1, 1),
    ('1.4 HINGES', 'All hinge screws and pins are installed and flush with door jamb substrate.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 4, 1, 1, 1),
    ('1.5 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 5, 1, 1, 1),
    ('1.6 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames') 
         AND phase_name = 'Clear Inspection'), 6, 1, 1, 1),

    -- Preset Commercial Doors - DOOR INSTALL
    ('1.1 LAYOUT', 'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Door Install'), 1, 1, 1, 1),
    ('1.2 FUNCTION', 'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Door Install'), 2, 1, 1, 1),
    ('1.3 HINGES', 'All hinge screws and pins are installed and flush with door jamb substrate.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Door Install'), 3, 1, 1, 1),
    ('1.4 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Door Install'), 4, 1, 1, 1),
    ('1.5 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Door Install'), 5, 1, 1, 1),

    -- Preset Commercial Doors - CLEAR INSPECTION
    ('1.1 LAYOUT', 'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 1, 1, 1, 1),
    ('1.2 FUNCTION', 'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 2, 1, 1, 1),
    ('1.3 FRAME', 'Door(s) Frame, Jamb, Snap-on Casing, Set screws, Etc. are installed complete. DR header Joints are tight and all nails/screws are set.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 3, 1, 1, 1),
    ('1.4 HINGES', 'All hinge screws and pins are installed and flush with door jamb substrate.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 4, 1, 1, 1),
    ('1.5 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 5, 1, 1, 1),
    ('1.6 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors') 
         AND phase_name = 'Clear Inspection'), 6, 1, 1, 1),

    -- Interior Door Hardware - Hinge, Lock, & Wallstop Install
    ('1.1 FUNCTION', 'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Hinge, Lock, & Wallstop Install'), 1, 1, 1, 1),
    ('1.2 HARDWARE SET SPECIFIC', 'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Hinge, Lock, & Wallstop Install'), 2, 1, 1, 1),
    ('1.3 HANDLE, KNOB, LEVER, or BAR', 'Handles/Knobs/Levers/Bar are installed per plan with door stop or other protection in place. (Electronic strikes have been installed, if applicable)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Hinge, Lock, & Wallstop Install'), 3, 1, 1, 1),
    ('1.4 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Hinge, Lock, & Wallstop Install'), 4, 1, 1, 1),
    ('1.5 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Hinge, Lock, & Wallstop Install'), 5, 1, 1, 1),

    -- Interior Door Hardware - Seal, Sweep, & Threshold Install
    ('1.1 FUNCTION', 'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Seal, Sweep, & Threshold Install'), 1, 1, 1, 1),
    ('1.2 HARDWARE SET SPECIFIC', 'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Seal, Sweep, & Threshold Install'), 2, 1, 1, 1),
    ('1.3 GASKETS & SEALS', 'Gaskets and Seals tight to the door, in good working order, absent of rips or tears. No light bleed is present. Door Cross is confirmed.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Seal, Sweep, & Threshold Install'), 3, 1, 1, 1),
    ('1.4 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Seal, Sweep, & Threshold Install'), 4, 1, 1, 1),
    ('1.5 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Seal, Sweep, & Threshold Install'), 5, 1, 1, 1),

    -- Interior Door Hardware - CLEAR INSPECTION
    ('1.1 FUNCTION', 'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 1, 1, 1, 1),
    ('1.2 HARDWARE SET SPECIFIC', 'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 2, 1, 1, 1),
    ('1.3 HANDLE, KNOB, LEVER, or BAR', 'Handles/Knobs/Levers/Bar are installed per plan with door stop or other protection in place. (Electronic strikes have been installed, if applicable)',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 3, 1, 1, 1),
    ('1.4 GASKETS & SEALS', 'Gaskets and Seals tight to the door, in good working order, absent of rips or tears. No light bleed is present. Door Cross is confirmed.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 4, 1, 1, 1),
    ('1.5 CLEANUP', 'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 5, 1, 1, 1),
    ('1.6 OTHER', 'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
        (SELECT TOP 1 id FROM field_tracker.unit_phases_by_scope 
         WHERE scope_type_id = (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware') 
         AND phase_name = 'Clear Inspection'), 6, 1, 1, 1);

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
        'AddNewRowsToClearInspectionChecklistItemTypes'
    );
    THROW;
END CATCH;