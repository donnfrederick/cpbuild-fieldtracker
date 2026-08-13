BEGIN TRANSACTION;

BEGIN TRY
    -- Create scope_details table
    CREATE TABLE field_tracker.project_rows (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_tracker_project_id INT NOT NULL,
        building VARCHAR(255),
        building_level VARCHAR(255),
        area VARCHAR(255),
        phase VARCHAR(255),
        scheme VARCHAR(255),
        unit VARCHAR(255),
        unit_type VARCHAR(255),
        scope_detail_code_id INT NOT NULL,
        location_type_id INT NOT NULL,
        cost_type_id INT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        starting_date DATETIME,
        finish_date DATETIME,
        percent_complete DECIMAL(10,4) NOT NULL DEFAULT 0,
        actual_man_hours DECIMAL(10,4) NOT NULL DEFAULT 0,
        clear_inspection_complete BIT NOT NULL DEFAULT 0,
        clear_inspection_passed BIT,
        clear_inspection_date DATETIME,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT,
        updated_at DATETIME,
        updated_by INT,
        deleted_at DATETIME,
        deleted_by INT,
        -- Foreign Key Constraints
        CONSTRAINT fk_field_tracker_project_id_project_rows FOREIGN KEY (field_tracker_project_id) REFERENCES field_tracker.projects (id),
        CONSTRAINT fk_scope_detail_code_id_project_rows FOREIGN KEY (scope_detail_code_id) REFERENCES field_tracker.scope_details (id),
        CONSTRAINT fk_location_type_id_project_rows FOREIGN KEY (location_type_id) REFERENCES field_tracker.location_types (id),
        CONSTRAINT fk_cost_type_id_project_rows FOREIGN KEY (cost_type_id) REFERENCES field_tracker.cost_types (id),
        CONSTRAINT fk_created_by_project_rows FOREIGN KEY (created_by) REFERENCES users (id),
        CONSTRAINT fk_updated_by_project_rows FOREIGN KEY (updated_by) REFERENCES users (id),
        CONSTRAINT fk_deleted_by_project_rows FOREIGN KEY (deleted_by) REFERENCES users (id)
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
        'ScopeDetailsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;