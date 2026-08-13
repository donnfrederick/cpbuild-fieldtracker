BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.clear_inspection_checklist_item_types (
        id INT PRIMARY KEY IDENTITY(1,1),
        item_name NVARCHAR(255) NOT NULL,
        description NVARCHAR(255) NOT NULL,
        phase_id INT NOT NULL,
        CONSTRAINT FK_clear_inspection_checklist_item_types_phase_id FOREIGN KEY (phase_id)
            REFERENCES field_tracker.unit_phases_by_scope(id),
        sort_order INT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        is_required BIT NOT NULL DEFAULT 1,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT UQ_clear_inspection_checklist_item_types_item_name_phase_id UNIQUE (item_name, phase_id)
    );

    INSERT INTO field_tracker.clear_inspection_checklist_item_types
        (item_name, description, phase_id, sort_order)
    VALUES
        (
            '1.1 LAYOUT',
            'All cabinetry is installed (plumb, square, and level) per plan with required clearance between cabinetry and adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            1
        ),
        (
            '1.2 APPLIANCES',
            'All appliance openings line up from uppers to lowers AND are the appropriate width . both front and back (30-30.25” for Range, 24-24.25 for Dishwasher, Refrigerator, Microwave, etc.).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            2
        ),
        (
            '1.3 DOORS & DRAWERS',
            'All Doors and Drawers are installed (including hardware and bumpers), operate freely, and are adjusted - with even and consistent reveals.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            3
        ),
        (
            '1.4 TRIM',
            'All necessary Trim and Molding is installed in the appropriate locations (as sequencing permits).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess materials and/or debris has been removed from the area and disposed of in the appropriate location. Cabinetry has been vacuumed or swept free of dirt and sawdust. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'All cabinetry is installed (plumb, square, and level) per plan with required clearance between cabinetry and adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 APPLIANCES',
            'All appliance openings line up from uppers to lowers AND are the appropriate width . both front and back (30-30.25” for Range, 24-24.25 for Dishwasher, Refrigerator, Microwave, etc.).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 DOORS & DRAWERS',
            'All Doors and Drawers are installed (including hardware and bumpers), operate freely, and are adjusted - with even and consistent reveals.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 TRIM',
            'All necessary Trim and Molding is installed in the appropriate locations (as sequencing permits).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess materials and/or debris has been removed from the area and disposed of in the appropriate location. Cabinetry has been vacuumed or swept free of dirt and sawdust. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'cabinetry') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 LAYOUT',
            'All countertops (including backsplash, window sills, or other like items) have all been installed per plan with appropriate clearances and overhangs. Countertops are square, and level.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            1
        ),
        (
            '1.2 APPLIANCES',
            'All appliance openings are the appropriate width both front and back (30-30.25” for range, refrigerator, etc.).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            2
        ),
        (
            '1.3 SEAMS & CAULK',
            'Countertops have been seamed with the appropriate material of the appropriate color. Seams are flush, scraped clean, and residue is removed. Caulking installed completely, where required.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            3
        ),
        (
            '1.4 SINKS',
            'Sinks are installed, centered in the counterto0 cutout, with even reveals.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the area and disposed of in the appropriate location. Area is broom swept and ready for the next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'All countertops (including backsplash, window sills, or other like items) have all been installed per plan with appropriate clearances and overhangs. Countertops are square, and level.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 APPLIANCES',
            'All appliance openings are the appropriate width both front and back (30-30.25” for range, refrigerator, etc.).',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 SEAMS & CAULK',
            'Countertops have been seamed with the appropriate material of the appropriate color. Seams are flush, scraped clean, and residue is removed. Caulking installed completely, where required.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 SINKS',
            'Sinks are installed, centered in the counterto0 cutout, with even reveals.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the area and disposed of in the appropriate location. Area is broom swept and ready for the next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Countertops') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            1
        ),
        (
            '1.2 APPLIANCES',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            2
        ),
        (
            '1.3 FRAME/TRIM INT',
            'Door(s) Frame, Jamb, Jamb-stop, Casing, Header, Etc. are installed complete. Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            3
        ),
        (
            '1.4 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Prehung Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 FRAME/TRIM INT',
            'Door(s) Frame, Jamb, Jamb-stop, Casing, Header, Etc. are installed complete. Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 IF HASFRAME/TRIM EXT',
            'If Door opening is on the ext of the building & our SOW includes Ext casing has the exterior casing been complete. All Miter Joints are tight and all nails are set. Simply check this off if it doesn’t apply.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.7 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors') AND phase_name = 'Clear Inspection'),
            7
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            2
        ),
        (
            '1.3 FRAME/TRIM INT',
            'Door(s) Frame, Jamb, Jamb-stop, Casing, Header, Etc. are installed complete. Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            3
        ),
        (
            '1.4 IF HAS FRAME/TRIM EXT',
            'If Door opening is on the ext of the building & our SOW includes Ext casing has the exterior casing been complete. All Miter Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            4
        ),
        (
            '1.5 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            5
        ),
        (
            '1.6 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            6
        ),
        (
            '1.7 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Prehung Install'),
            7
        ),
        (
            '1.1 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Millwork Install'),
            1
        ),
        (
            '1.2 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Millwork Install'),
            2
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 FRAME/TRIM INT',
            'Door(s) Frame, Jamb, Jamb-stop, Casing, Header, Etc. are installed complete. Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 IF HAS FRAME/TRIM EXT',
            'If Door opening is on the ext of the building & our SOW includes Ext casing has the exterior casing been complete. All Miter Joints are tight and all nails are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            5
        ),
        (   
            '1.6 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.7 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors') AND phase_name = 'Clear Inspection'),
            7
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            2
        ),
        (
            '1.3 FRAME',
            'Door(s) Frame, Jamb, Snap-on Casing, Set screws, Etc. are installed complete. DR header Joints are tight and all nails/screws are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            3
        ),
        (
            '1.4 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Frame Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Door Install'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Door Install'),
            2
        ),
        (
            '1.3 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Door Install'),
            3
        ),
        (
            '1.4 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Door Install'),
            4
        ),
        (
            '1.5 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Door Install'),
            5
        ),
        (
            '1.1 LAYOUT',
            'Are installed per plan (plumb, square, and level - with appropriate swing) with required clearance between adjacent elements.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 FUNCTION',
            'Door(s) operates smoothly and quietly without binding / scraping / grinding / rubbing. Reveals & Cross are even and consistent.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 FRAME',
            'Door(s) Frame, Jamb, Snap-on Casing, Set screws, Etc. are installed complete. DR header Joints are tight and all nails/screws are set.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 HINGES',
            'All hinge screws and pins are installed and flush with door jamb substrate.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 1.1 FUNCTION',
            'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            1
        ),
        (
            '1.2 HARDWARE SET SPECIFIC',
            'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            2
        ),
        (
            '1.3 HANDLE, KNOB, LEVER, or BAR',
            'Handles/Knobs/Levers/Bar are installed per plan with door stop or other protection in place. (Electronic strikes have been installed, if applicable)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            3
        ),
        (
            '1.4 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            4
        ),
        (
            '1.5 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Hinge, Lock, & Wallstop Install'),
            5
        ),
        (
            '1.1 FUNCTION',
            'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Seal, Sweep, & Threshold Install'),
            1
        ),
        (
            '1.2 HARDWARE SET SPECIFIC',
            'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Seal, Sweep, & Threshold Install'),
            2
        ),
        (
            '1.3 GASKETS & SEALS',
            'Gaskets and Seals tight to the door, in good working order, absent of rips or tears. No light bleed is present. Door Cross is confirmed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Seal, Sweep, & Threshold Install'),
            3
        ),
        (
            '1.4 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Seal, Sweep, & Threshold Install'),
            4
        ),
        (
            '1.5 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Seal, Sweep, & Threshold Install'),
            5
        ),
        (
            '1.1 FUNCTION',
            'Hardware operates smoothly, Keys function, and the back pressure is set accurately (Springs, Closures, etc.) (If applicable, weight of the pull is set to ADA Standard - 5 lbs.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 HARDWARE SET SPECIFIC',
            'All specified hardware is installed per plan with door stop or other protection in place. (Handles, Levers, Bars, Knobs, Kickplates, Thresholds, Silencers, Stops, Stickers, Closers, Viewers, Sweeps, etc.)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 HANDLE, KNOB, LEVER, or BAR',
            'Handles/Knobs/Levers/Bar are installed per plan with door stop or other protection in place. (Electronic strikes have been installed, if applicable)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 GASKETS & SEALS',
            'Gaskets and Seals tight to the door, in good working order, absent of rips or tears. No light bleed is present. Door Cross is confirmed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Baseboard Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Casing Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Casings') AND phase_name = 'Clear Inspection'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have been submitted as blocking issues, and have been resolved.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Shelving Install'),
            6
        ),
        (
            '1.1 LAYOUT',
            'Trim & Millwork(s) are installed per plan in all of the appropriate locations',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            1
        ),
        (
            '1.2 SUBSTRATES & DIMENSIONS',
            'Substrates appear to have been prepped - free of debris, bulges, bumps, etc. so that the finished trim and millwork appear smooth and tight to the wall, but held at appropriate dimensions for other trades to perform their work (as required - IE. flooring)',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            2
        ),
        (
            '1.3 CUTS',
            'All cuts are clean - outside corners are mitered & glued, lap joints are mitered & glued, and inside corners aligned. Joints and corners align and are sanded & clean.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            3
        ),
        (
            '1.4 FASTENERS',
            'Trim and Millwork are firmly affixed - nails are appropriately set - under the face of the material and glue/residue has been removed.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            4
        ),
        (
            '1.5 CLEANUP',
            'Excess material and/or debris has been removed from the Area and disposed of in the appropriate location. Area is broom swept and ready for next trades.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            5
        ),
        (
            '1.6 OTHER',
            'Any other deficiencies that would have caused the SOW to be incomplete have already been resolved as punch work tasks.',
            (SELECT id FROM field_tracker.unit_phases_by_scope WHERE scope_type_id = (SELECT id FROM field_tracker.scope_types WHERE scope_name = 'Shelving') AND phase_name = 'Clear Inspection'),
            6
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