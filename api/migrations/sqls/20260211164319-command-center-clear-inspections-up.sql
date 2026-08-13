BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_clear_inspections')
    BEGIN
        CREATE TABLE field_tracker.command_center_clear_inspections (
            id INT IDENTITY(1,1) NOT NULL,
            unit_by_scope_id INT NOT NULL,
            project_row_id INT NOT NULL,
            status_id INT NOT NULL,
            marked_ready_at DATETIME NOT NULL,
            marked_ready_by INT NOT NULL,
            inspected_at DATETIME NULL,
            inspected_by INT NULL,
            notes NVARCHAR(MAX) NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE(),
            updated_at DATETIME NOT NULL DEFAULT GETDATE(),
            deleted_at DATETIME NULL,
            CONSTRAINT PK_command_center_clear_inspections PRIMARY KEY (id),
            CONSTRAINT FK_command_center_clear_inspections_unit_by_scope_id FOREIGN KEY (unit_by_scope_id) REFERENCES field_tracker.units_by_scope(id),
            CONSTRAINT FK_command_center_clear_inspections_project_row_id FOREIGN KEY (project_row_id) REFERENCES field_tracker.project_rows(id),
            CONSTRAINT FK_command_center_clear_inspections_status_id FOREIGN KEY (status_id) REFERENCES field_tracker.command_center_clear_inspection_statuses(id),
            CONSTRAINT FK_command_center_clear_inspections_marked_ready_by FOREIGN KEY (marked_ready_by) REFERENCES dbo.users(id),
            CONSTRAINT FK_command_center_clear_inspections_inspected_by FOREIGN KEY (inspected_by) REFERENCES dbo.users(id)
        );

        -- Unique constraint on unit_by_scope_id (WHERE deleted_at IS NULL)
        -- This unique index also serves as the non-clustered index for lookups
        CREATE UNIQUE NONCLUSTERED INDEX UQ_command_center_clear_inspections_unit_by_scope_id 
        ON field_tracker.command_center_clear_inspections(unit_by_scope_id) 
        WHERE deleted_at IS NULL;

        -- Composite index on status_id and unit_by_scope_id for filtering (WHERE deleted_at IS NULL)
        CREATE NONCLUSTERED INDEX IX_command_center_clear_inspections_status_unit 
        ON field_tracker.command_center_clear_inspections(status_id, unit_by_scope_id) 
        WHERE deleted_at IS NULL;
    END

    SELECT 
        id,
        unit_by_scope_id,
        project_row_id,
        status_id,
        marked_ready_at,
        marked_ready_by,
        inspected_at,
        inspected_by,
        created_at,
        updated_at,
        deleted_at
    FROM field_tracker.command_center_clear_inspections
    ORDER BY created_at DESC;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;