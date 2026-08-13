BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.unit_tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        
        unit_by_scope_id INT NOT NULL,
        CONSTRAINT FK_UnitTasks_UnitByScope FOREIGN KEY (unit_by_scope_id) 
            REFERENCES field_tracker.units_by_scope(id),

        parent_task_id INT NULL,

        task_type_id INT NOT NULL,
        CONSTRAINT FK_UnitTasks_TaskType FOREIGN KEY (task_type_id) 
            REFERENCES field_tracker.task_types(id),

        phase_id INT NULL,
        CONSTRAINT FK_UnitTasks_Phase FOREIGN KEY (phase_id) 
            REFERENCES field_tracker.unit_phases_by_scope(id),

        status_id INT NOT NULL,
        CONSTRAINT FK_UnitTasks_Status FOREIGN KEY (status_id) 
            REFERENCES field_tracker.task_status_types(id),

        assigned_worker_id INT NULL,
        CONSTRAINT FK_UnitTasks_AssignedWorker FOREIGN KEY (assigned_worker_id) 
            REFERENCES field_tracker.workers(id),

        scheduled_date DATETIME NULL,
        scheduled_by INT NULL,
        CONSTRAINT FK_UnitTasks_ScheduledBy FOREIGN KEY (scheduled_by) 
            REFERENCES dbo.users(id),

        submitted_at DATETIME NULL,
        submitted_by INT NULL,
        CONSTRAINT FK_UnitTasks_SubmittedBy FOREIGN KEY (submitted_by) 
            REFERENCES dbo.users(id),

        submission_notes NVARCHAR(2000) NULL,

        reviewed_at DATETIME NULL,
        reviewed_by INT NULL,
        CONSTRAINT FK_UnitTasks_ReviewedBy FOREIGN KEY (reviewed_by) 
            REFERENCES dbo.users(id),

        review_notes NVARCHAR(2000) NULL,

        task_details NVARCHAR(2000) NULL,

        image_acknowledgment BIT NOT NULL DEFAULT 0,

        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        updated_at DATETIME NULL,
        updated_by INT NULL,
        deleted_at DATETIME NULL,
        deleted_by INT NULL,

        CONSTRAINT FK_UnitTasks_CreatedBy FOREIGN KEY (created_by) 
            REFERENCES dbo.users(id),
        CONSTRAINT FK_UnitTasks_UpdatedBy FOREIGN KEY (updated_by) 
            REFERENCES dbo.users(id),
        CONSTRAINT FK_UnitTasks_DeletedBy FOREIGN KEY (deleted_by) 
            REFERENCES dbo.users(id)
    );

    ALTER TABLE field_tracker.unit_tasks
    ADD CONSTRAINT FK_UnitTasks_ParentTask FOREIGN KEY (parent_task_id)
        REFERENCES field_tracker.unit_tasks(id);

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