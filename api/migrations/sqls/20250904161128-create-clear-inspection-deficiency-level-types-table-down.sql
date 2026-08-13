BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.indexes 
               WHERE name = 'UX_clear_inspection_def_level_name_CI' 
                 AND object_id = OBJECT_ID('field_tracker.clear_inspection_deficiency_level_types'))
    BEGIN
        DROP INDEX UX_clear_inspection_def_level_name_CI 
            ON field_tracker.clear_inspection_deficiency_level_types;
    END

    IF EXISTS (SELECT 1 FROM sys.indexes 
               WHERE name = 'IX_clear_inspection_def_level_isActive_sortOrder' 
                 AND object_id = OBJECT_ID('field_tracker.clear_inspection_deficiency_level_types'))
    BEGIN
        DROP INDEX IX_clear_inspection_def_level_isActive_sortOrder 
            ON field_tracker.clear_inspection_deficiency_level_types;
    END

    IF OBJECT_ID('field_tracker.clear_inspection_deficiency_level_types', 'U') IS NOT NULL
    BEGIN
        DROP TABLE field_tracker.clear_inspection_deficiency_level_types;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error
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
        'ClearInspectionDeficiencyLevelTypesDrop'
    );

    -- Re-throw
    THROW;
END CATCH;
