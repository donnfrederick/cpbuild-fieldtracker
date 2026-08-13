BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @ConstraintName NVARCHAR(128);
    DECLARE @ConstraintName NVARCHAR(128);
    DECLARE @Sql NVARCHAR(MAX);

    -- Find the name of the foreign key constraint dynamically
    SELECT @ConstraintName = fk.name
    FROM sys.foreign_keys AS fk
    WHERE fk.parent_object_id = OBJECT_ID('field_tracker.projects')
    AND fk.referenced_object_id = OBJECT_ID('dbo.projects');

    -- If the constraint exists, drop it using dynamic SQL
    IF @ConstraintName IS NOT NULL
    BEGIN
        SET @Sql = N'ALTER TABLE field_tracker.projects DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
        EXEC sp_executesql @Sql;
    END

    -- Drop the recreated 'projects' table
    IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.projects;
    END

    -- Recreate the original 'projects' table with the old schema
    -- Note: This should match the original schema prior to the "up" migration
    CREATE TABLE dbo.projects (
        -- Include the original columns and any constraints that were there
        id INT IDENTITY(1, 1) PRIMARY KEY,
        wip_billing_group_number NVARCHAR(150) UNIQUE,
        p6_project_id NVARCHAR(150) UNIQUE,
        project_manager_id INT,
        install_manager_id INT,
        state_id INT,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME,
        updated_by INT,
        FOREIGN KEY (project_manager_id) REFERENCES users(id),
        FOREIGN KEY (install_manager_id) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id),
        FOREIGN KEY (state_id) REFERENCES states(id)
    );

    -- If there was an original foreign key on 'field_tracker.projects', re-add it here
    -- This assumes that 'field_tracker.projects' had a 'project_id' column referencing 'dbo.projects' 'id'
    ALTER TABLE field_tracker.projects
    ADD CONSTRAINT FK_projects_project_id FOREIGN KEY (project_id) REFERENCES dbo.projects(id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Insert error log handling as in the 'up' migration
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
        'ProjectsDownMigrationScript'
    );

    THROW;
END CATCH;
