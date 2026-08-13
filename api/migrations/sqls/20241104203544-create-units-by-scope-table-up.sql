BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the original table if it exists to ensure consistency
    IF OBJECT_ID('field_tracker.ihi_units_by_scope_type', 'U') IS NOT NULL
    BEGIN
        DROP TABLE field_tracker.ihi_units_by_scope_type;
        PRINT 'Dropped existing table: field_tracker.ihi_units_by_scope_type';
    END

    -- Create the new table with the correct name and constraints
    CREATE TABLE field_tracker.units_by_scope (
        id INT IDENTITY(1,1) PRIMARY KEY,
        project_by_scope_id INT NOT NULL,
        ihi_project_id INT NOT NULL,
        unit_id INT NOT NULL,
        current_phase_id INT NULL,
        status_id INT NULL,
        staging_completion_date DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL
    );

    -- Add foreign key constraints
    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_project_by_scope_id
    FOREIGN KEY (project_by_scope_id) REFERENCES field_tracker.projects_by_scope(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_unit_id
    FOREIGN KEY (unit_id) REFERENCES field_tracker.project_rows(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_current_phase_id
    FOREIGN KEY (current_phase_id) REFERENCES field_tracker.unit_phases_by_scope(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_status_id
    FOREIGN KEY (status_id) REFERENCES field_tracker.unit_by_scope_status_types(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_created_by
    FOREIGN KEY (created_by) REFERENCES dbo.users(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_updated_by
    FOREIGN KEY (updated_by) REFERENCES dbo.users(id);

    ALTER TABLE field_tracker.units_by_scope
    ADD CONSTRAINT FK_units_by_scope_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES dbo.users(id);

    COMMIT TRANSACTION;
    PRINT 'Successfully created table: field_tracker.units_by_scope';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    PRINT 'Error encountered: ' + ERROR_MESSAGE();
END CATCH;