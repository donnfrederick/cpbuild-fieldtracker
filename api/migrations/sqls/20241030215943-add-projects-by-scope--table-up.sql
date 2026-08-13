BEGIN TRANSACTION;

BEGIN TRY
    -- Create projects_by_scope table
    CREATE TABLE field_tracker.projects_by_scope (
        id INT IDENTITY(1,1) PRIMARY KEY,
        project_id INT NOT NULL,
        scope_type_id INT NOT NULL,
        status_id INT NOT NULL,
        team_lead_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NOT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL
    );

    -- Add unique constraint to enforce unique combination of project_id and scope_type_id
    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT UQ_project_id_and_scope_type_id UNIQUE (project_id, scope_type_id);

    -- Add foreign key constraints
    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_project_id
    FOREIGN KEY (project_id)
    REFERENCES field_tracker.projects (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_scope_type_id
    FOREIGN KEY (scope_type_id)
    REFERENCES field_tracker.scope_types (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_status_id
    FOREIGN KEY (status_id)
    REFERENCES field_tracker.projects_by_scope_status_types (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_team_lead_id
    FOREIGN KEY (team_lead_id)
    REFERENCES field_tracker.team_leads (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_created_by
    FOREIGN KEY (created_by)
    REFERENCES dbo.users (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES dbo.users (id);

    ALTER TABLE field_tracker.projects_by_scope
    ADD CONSTRAINT fk_projects_by_scope_deleted_by
    FOREIGN KEY (deleted_by)
    REFERENCES dbo.users (id);

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