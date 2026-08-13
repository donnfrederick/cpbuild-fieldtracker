BEGIN TRANSACTION;

BEGIN TRY
    -- Check if foreign key exists and drop it
    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        INNER JOIN sys.tables AS t ON fk.parent_object_id = t.object_id
        WHERE 
            fk.name = 'FK_worker_role_assignments_worker_role_type_id'
            AND t.name = 'worker_role_assignments'
            AND t.schema_id = SCHEMA_ID('field_tracker')
    )
    BEGIN
        -- Drop the foreign key constraint
        ALTER TABLE field_tracker.worker_role_assignments
        DROP CONSTRAINT FK_worker_role_assignments_worker_role_type_id;
    END

    -- Check if the table exists before dropping it
    IF OBJECT_ID('field_tracker.worker_role_types', 'U') IS NOT NULL
    BEGIN
        DROP TABLE field_tracker.worker_role_types;
    END

    CREATE TABLE field_tracker.worker_role_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        role_type_name NVARCHAR(255) NOT NULL,
        scope_type_id INT NOT NULL,
        description NVARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_worker_role_types_scope_type_id FOREIGN KEY (scope_type_id) REFERENCES field_tracker.scope_types(id)
    );

    INSERT INTO field_tracker.worker_role_types (role_type_name, scope_type_id)
    VALUES
        ('Assembler', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry')),
        ('Installer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Cabinetry')),
        ('Installer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Countertops')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Interior Prehung Doors')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Residential Exterior Prehung Doors')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Doors')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Commercial Door Hardware')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Baseboards')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Casings')),
        ('Skilled Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving')),
        ('Apprentice', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving')),
        ('Laborer', (SELECT TOP 1 id FROM field_tracker.scope_types WHERE scope_name = 'Shelving'));

    ALTER TABLE field_tracker.worker_role_assignments
    ADD CONSTRAINT FK_worker_role_assignments_worker_role_type_id 
    FOREIGN KEY (worker_role_type_id) 
    REFERENCES field_tracker.worker_role_types(id);

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
        'CreateInstallTeamsTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
