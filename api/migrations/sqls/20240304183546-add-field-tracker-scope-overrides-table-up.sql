BEGIN TRANSACTION;

BEGIN TRY
    -- Create scope_overrides table
    CREATE TABLE field_tracker.scope_overrides (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_tracker_project_id INT NOT NULL,
        scope_details_id INT NOT NULL,
        man_hours_quantity_override DECIMAL(10, 4),
        install_factor_override DECIMAL(10, 4),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT,
        updated_at DATETIME,
        updated_by INT,
        deleted_at DATETIME,
        deleted_by INT,
        -- Foreign Key Constraint
        CONSTRAINT fk_field_tracker_project_id_scope_overrides FOREIGN KEY (field_tracker_project_id) REFERENCES field_tracker.projects (id),
        CONSTRAINT fk_scope_details_id_scope_overrides FOREIGN KEY (scope_details_id) REFERENCES field_tracker.scope_details (id),
        CONSTRAINT fk_created_by_scope_overrides FOREIGN KEY (created_by) REFERENCES dbo.users (id),
        CONSTRAINT fk_updated_by_scope_overrides FOREIGN KEY (updated_by) REFERENCES dbo.users (id),
        CONSTRAINT fk_deleted_by_scope_overrides FOREIGN KEY (deleted_by) REFERENCES dbo.users (id),
        -- Unique Constraint
        CONSTRAINT uc_field_tracker_project_id_scope_details_id_scope_overrides UNIQUE (field_tracker_project_id, scope_details_id)
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
        'ScopeOverridesMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
