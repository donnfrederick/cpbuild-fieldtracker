BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @ConstraintName NVARCHAR(128);

    -- Find the name of the foreign key constraint
    SELECT @ConstraintName = fk.name
    FROM sys.foreign_keys AS fk
    INNER JOIN sys.foreign_key_columns AS fc ON fk.object_id = fc.constraint_object_id
    INNER JOIN sys.tables AS t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.columns AS c ON fc.parent_column_id = c.column_id AND fc.parent_object_id = t.object_id
    WHERE t.name = 'projects'
    AND SCHEMA_NAME(t.schema_id) = 'field_tracker'
    AND c.name = 'project_id'
    AND fk.referenced_object_id = OBJECT_ID('dbo.projects');

    -- If the constraint exists, drop it
    IF @ConstraintName IS NOT NULL
    BEGIN
        DECLARE @Sql NVARCHAR(MAX) = N'ALTER TABLE field_tracker.projects DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
        EXEC sp_executesql @Sql;
    END

    -- Drop the table if it exists
    IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.projects;
    END

    -- Recreate the table with the new schema
    CREATE TABLE dbo.projects (
        id INT PRIMARY KEY IDENTITY(1,1),
        project_name NVARCHAR(255) NOT NULL UNIQUE,
        project_status_id INT NOT NULL DEFAULT 1,
        project_manager_id INT,
        install_manager_id INT,
        state_id INT,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME,
        updated_by INT,
        FOREIGN KEY (project_manager_id) REFERENCES users(id),
        FOREIGN KEY (install_manager_id) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id),
        FOREIGN KEY (state_id) REFERENCES states(id),
        FOREIGN KEY (project_status_id) REFERENCES dbo.project_status_types(id)
    );

    -- Recreate the foreign key constraint in field_tracker.projects
    ALTER TABLE field_tracker.projects
    ADD CONSTRAINT FK_projects_project_id FOREIGN KEY (project_id) REFERENCES dbo.projects(id);

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
        'ProjectsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
