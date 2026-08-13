BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.clear_inspection_checklist_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        task_id INT NOT NULL,
        CONSTRAINT FK_ClearInspection_Task FOREIGN KEY (task_id)
            REFERENCES field_tracker.unit_tasks (id),
        item_type_id INT NOT NULL,
        CONSTRAINT FK_ClearInspection_ItemType FOREIGN KEY (item_type_id)
            REFERENCES field_tracker.clear_inspection_checklist_item_types (id),
        is_checked BIT NOT NULL DEFAULT 0,
        checked_by INT NULL,
        CONSTRAINT FK_ClearInspection_CheckedBy FOREIGN KEY (checked_by)
            REFERENCES dbo.users (id),
        checked_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT NOT NULL,
        CONSTRAINT FK_ClearInspection_CreatedBy FOREIGN KEY (created_by)
            REFERENCES dbo.users (id),
        updated_at DATETIME NULL,
        updated_by INT NULL,
        CONSTRAINT FK_ClearInspection_UpdatedBy FOREIGN KEY (updated_by)
            REFERENCES dbo.users (id),
        deleted_at DATETIME NULL,
        deleted_by INT NULL,
        CONSTRAINT FK_ClearInspection_DeletedBy FOREIGN KEY (deleted_by)
            REFERENCES dbo.users (id),
        CONSTRAINT UQ_ClearInspection_TaskItem UNIQUE (task_id, item_type_id)
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