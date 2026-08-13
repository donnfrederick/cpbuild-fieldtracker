BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.work_hour_submissions (
        id INT PRIMARY KEY IDENTITY(1,1),
        
        worker_id INT NOT NULL,
        CONSTRAINT fk_worker_id FOREIGN KEY (worker_id) REFERENCES field_tracker.workers(id),

        project_by_scope_id INT NOT NULL,
        CONSTRAINT fk_project_by_scope_id FOREIGN KEY (project_by_scope_id) REFERENCES field_tracker.projects_by_scope(id),

        task_id INT NULL,
        CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES field_tracker.unit_tasks(id),

        role_id INT NULL,
        CONSTRAINT fk_role_id FOREIGN KEY (role_id) REFERENCES field_tracker.worker_role_types(id),

        submit_type_id INT NOT NULL,
        CONSTRAINT fk_submit_type_id FOREIGN KEY (submit_type_id) REFERENCES field_tracker.work_hour_submission_types(id),

        status_id INT NOT NULL,
        CONSTRAINT fk_status_id FOREIGN KEY (status_id) REFERENCES field_tracker.work_hour_submission_status_types(id),

        last_status_update DATETIME NULL,
        
        status_updated_by INT NULL,
        CONSTRAINT fk_status_updated_by FOREIGN KEY (status_updated_by) REFERENCES dbo.users(id),

        hours INT NOT NULL,
        
        hours_override INT NULL,

        quantity SMALLINT NULL,
        quantity_override SMALLINT NULL,

        submission_date DATETIME NOT NULL,

        submission_notes NVARCHAR(1000) NULL,
        manager_notes NVARCHAR(1000) NULL,

        created_at DATETIME DEFAULT GETDATE(),

        created_by INT NOT NULL,
        CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES dbo.users(id),

        updated_at DATETIME NULL,

        updated_by INT NULL,
        CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id),

        deleted_at DATETIME NULL,

        deleted_by INT NULL,
        CONSTRAINT fk_deleted_by FOREIGN KEY (deleted_by) REFERENCES dbo.users(id)
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