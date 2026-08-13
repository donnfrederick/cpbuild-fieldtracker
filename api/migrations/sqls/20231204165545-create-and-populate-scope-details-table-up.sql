BEGIN TRANSACTION;

BEGIN TRY
    -- Create scope_details table
    CREATE TABLE field_tracker.scope_details (
        id INT IDENTITY(1,1) PRIMARY KEY,
        scope_detail_code VARCHAR(10) NOT NULL,
        scope_detail_description NVARCHAR(255) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        prime_code_id INT NOT NULL,
        sub_prime_code_id INT NOT NULL,
        uom_type_id INT NOT NULL,
        man_hours_quantity DECIMAL(10,4) NOT NULL,
        install_factor DECIMAL(10,4) NOT NULL,
        -- Foreign Key Constraint
        CONSTRAINT fk_prime_code_scope_details FOREIGN KEY (prime_code_id) REFERENCES field_tracker.prime_codes (id),
        CONSTRAINT fk_sub_prime_code_scope_details FOREIGN KEY (sub_prime_code_id) REFERENCES field_tracker.sub_prime_codes (id),
        CONSTRAINT fk_uom_type_id_scope_details FOREIGN KEY (uom_type_id) REFERENCES field_tracker.uom_types (id),
        -- Composite Unique Constraint
        CONSTRAINT uc_prime_sub_prime_scope_detail UNIQUE (prime_code_id, sub_prime_code_id, scope_detail_code)
    );

    -- Populate sub_prime_codes table with a subquery to get prime_code_id
    INSERT INTO field_tracker.scope_details (scope_detail_code, scope_detail_description, prime_code_id, sub_prime_code_id, uom_type_id, man_hours_quantity, install_factor)
    VALUES
    ('062213', 'Standard Pattern Wood Trim',                    (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('062213', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('062213', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'LF'), 0.0330, 0.75),
    ('064113', 'Wood-Veneer-Faced Architectural Cabinets',      (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('064113', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('064113', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('064116', 'Plastic-Laminate-Clad Architectural Cabinets',  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('064116', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('064116', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('064193', 'Cabinet and Drawer Hardware',                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('064193', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('064193', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.0540, 0.75),
    ('064613', 'Wood Door and Window Casings',                  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('064613', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('064613', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'LF'), 0.0330, 0.75),
    ('081413', 'Carved Wood Doors',                             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('081413', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('081413', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 1.0000, 0.75),
    ('081416', 'Flush Wood Doors',                              (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('081416', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('081416', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 1.0000, 0.75),
    ('081423', 'Clad Wood Doors',                               (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('081423', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('081423', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 1.0000, 0.75),
    ('087110', 'Door Hardware',                                 (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('087110', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('087110', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 2.0000, 0.75),
    ('088313', 'Mirrors',                                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('088313', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('088313', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.8000, 0.75),
    ('093013', 'Ceramic Tiling',                                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093013', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093013', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093016', 'Quarry Tiling',                                 (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093016', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093016', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093019', 'Paver Tiling',                                  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093019', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093019', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093023', 'Glass Mosaic Tiling',                           (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093023', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093023', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093026', 'Plastic Tiling',                                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093026', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093026', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093029', 'Metal Tiling',                                  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093029', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093029', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093033', 'Stone Tiling',                                  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093033', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093033', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093036', 'Concrete Tiling',                               (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093036', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093036', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('093039', 'Brick Tiling',                                  (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('093039', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('093039', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('096210', 'Entrance Grilles',                              (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096210', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096210', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.5460, 0.75),
    ('096416', 'Wood Block Flooring',                           (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096416', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096416', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096419', 'Wood Composition Flooring',                     (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096419', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096419', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096423', 'Wood Parquet Flooring',                         (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096423', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096423', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096429', 'Wood Strip and Plank Flooring',                 (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096429', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096429', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096433', 'Laminated Wood Flooring',                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096433', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096433', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096453', 'Resilient Wood Flooring Assemblies',            (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096453', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096453', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096466', 'Wood Athletic Flooring',                        (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096466', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096466', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1040, 0.75),
    ('096513', 'Resilient Base and Accessories',                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096513', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096513', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'LF'), 0.0330, 0.75),
    ('096516', 'Resilient Sheet Flooring',                      (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096516', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096516', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0660, 0.75),
    ('096519', 'Resilient Tile Flooring',                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096519', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096519', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0660, 0.75),
    ('096533', 'Conductive Resilient Flooring',                 (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096533', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096533', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0660, 0.75),
    ('096536', 'Static-Control Resilient Flooring',             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096536', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096536', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0660, 0.75),
    ('096543', 'Linoleum Flooring',                             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096543', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096543', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0660, 0.75),
    ('096566', 'Resilient Athletic Flooring',                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096566', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096566', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0800, 0.75),
    ('096613', 'Portland Cement Terrazzo Flooring',             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096613', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096613', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('096616', 'Terrazzo Flooring',                             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096616', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096616', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1070, 0.75),
    ('096713', 'Elastomeric Liquid Flooring',                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096713', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096713', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096716', 'Epoxy-Marble Chip Flooring',                    (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096716', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096716', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096719', 'Magnesium-Oxychloride Flooring',                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096719', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096719', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096723', 'Resinous Flooring',                             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096723', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096723', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096726', 'Quartz Flooring',                               (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096726', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096726', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096766', 'Fluid-Applied Athletic Flooring',               (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096766', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096766', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.0920, 0.75),
    ('096813', 'Tile Carpeting',                                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096813', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096813', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SY'), 0.5400, 0.75),
    ('096816', 'Sheet Carpeting (Broadloom)',                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('096816', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('096816', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SY'), 0.1503, 0.75),
    ('102816', 'Bath Accessories',                              (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('102816', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('102816', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.2500, 0.75),
    ('122113', 'Wood Blinds',                                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('122113', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('122113', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.2760, 0.75),
    ('122116', 'Vertical Louver Blinds',                        (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('122116', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('122116', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.2760, 0.75),
    ('122123', 'Roll-Down Blinds',                              (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('122123', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('122123', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.2760, 0.75),
    ('122126', 'Black-Out Blinds',                              (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('122126', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('122126', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.2760, 0.75),
    ('123213', 'Manfactured Wood-Veneer-Faced Casework',        (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123213', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123213', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('123216', 'Manufactured Plastic-Laminate-Clad Casework',   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123216', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123216', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('123416', 'Manufactured Solid Plastic Casework',           (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123416', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123416', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('123419', 'Manufactured Solid Surface Casework',           (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123419', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123419', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('123500', 'Specialty Casework',                            (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123500', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123500', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.4851, 0.75),
    ('123613', 'Concrete Countertops',                          (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123613', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123613', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1570, 0.75),
    ('123640', 'Stone Countertops',                             (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123640', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123640', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1570, 0.75),
    ('123661', 'Simulated Stone Countertops',                   (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('123661', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('123661', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'SF'), 0.1570, 0.75),
    ('224113', 'Toilets',                                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('224113', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('224113', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 3.0190, 0.75),
    ('224116', 'Sinks',                                         (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('224116', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('224116', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 2.8570, 0.75),
    ('224123', 'Showers',                                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('224123', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('224123', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 3.3330, 0.75),
    ('224139', 'Faucets',                                       (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('224139', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('224139', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 1.0000, 0.75),
    ('233423', 'Ventilator Fans',                               (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('233423', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('233423', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.9000, 0.75),
    ('265113', 'Incandescent Interior Lighting',                (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('265113', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('265113', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.6670, 0.75),
    ('265116', 'Flourescent Interior Lighting',                 (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('265116', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('265116', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.6670, 0.75),
    ('265119', 'LED Interior Lighting',                         (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('265119', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('265119', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.6670, 0.75),
    ('265123', 'HID Interior Lighting',                         (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('265123', 2)), (SELECT id FROM field_tracker.sub_prime_codes WHERE sub_prime_code = LEFT('265123', 4)), (SELECT id FROM field_tracker.uom_types WHERE uom_name = 'EA'), 0.6670, 0.75)

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
        'ScopeDetailsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;