BEGIN TRANSACTION;

BEGIN TRY
    IF COL_LENGTH('field_tracker.clear_inspection_checklist_items', 'passed') IS NULL
        ALTER TABLE field_tracker.clear_inspection_checklist_items ADD passed BIT NULL;

    IF COL_LENGTH('field_tracker.clear_inspection_checklist_items', 'deficiency_count') IS NULL
        ALTER TABLE field_tracker.clear_inspection_checklist_items ADD deficiency_count INT NULL;

    IF COL_LENGTH('field_tracker.clear_inspection_checklist_items', 'deficiency_level_type_id') IS NULL
        ALTER TABLE field_tracker.clear_inspection_checklist_items ADD deficiency_level_type_id INT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'ClearInspectionChecklistItemsAlterAdd'
    );

    THROW;
END CATCH;