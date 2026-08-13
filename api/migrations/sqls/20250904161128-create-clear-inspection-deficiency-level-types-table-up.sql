BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.clear_inspection_deficiency_level_types (
        id INT IDENTITY(1,1) PRIMARY KEY,

        name NVARCHAR(50) NOT NULL,
        sort_order INT NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        description NVARCHAR(255) NULL,

        CONSTRAINT UX_clear_inspection_def_level_name UNIQUE (name),
        CONSTRAINT CK_clear_inspection_def_level_sort_order CHECK (sort_order > 0)
    );


    CREATE NONCLUSTERED INDEX IX_clear_inspection_def_level_isActive_sortOrder
        ON field_tracker.clear_inspection_deficiency_level_types (is_active, sort_order);

    INSERT INTO field_tracker.clear_inspection_deficiency_level_types (name, sort_order, description)
    VALUES 
        ('Minor', 1, 'Low severity deficiency'),
        ('Major', 2, 'Medium severity deficiency'),
        ('Critical', 3, 'High severity deficiency');

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
        'ClearInspectionDeficiencyLevelTypesCreation'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;