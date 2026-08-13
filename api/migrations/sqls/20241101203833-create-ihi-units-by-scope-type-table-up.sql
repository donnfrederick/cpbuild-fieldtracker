BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.ihi_units_by_scope_type (
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
        deleted_by INT NULL,
        CONSTRAINT FK_ihi_units_by_scope_type_project_by_scope_id FOREIGN KEY (project_by_scope_id) REFERENCES field_tracker.projects_by_scope(id),
        CONSTRAINT FK_ihi_units_by_scope_type_unit_id FOREIGN KEY (unit_id) REFERENCES field_tracker.project_rows(id),
        CONSTRAINT FK_ihi_units_by_scope_type_current_phase_id FOREIGN KEY (current_phase_id) REFERENCES field_tracker.unit_phases_by_scope(id),
        CONSTRAINT FK_ihi_units_by_scope_type_status_id FOREIGN KEY (status_id) REFERENCES field_tracker.unit_by_scope_status_types(id),
        CONSTRAINT FK_ihi_units_by_scope_type_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_ihi_units_by_scope_type_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id),
        CONSTRAINT FK_ihi_units_by_scope_type_deleted_by FOREIGN KEY (deleted_by) REFERENCES dbo.users(id)
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
