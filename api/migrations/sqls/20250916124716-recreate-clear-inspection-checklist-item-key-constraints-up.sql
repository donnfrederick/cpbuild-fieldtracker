BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.clear_inspection_checklist_items
    DROP CONSTRAINT CK_ClearInspectionChecklistItems_PassOrPendingNoDetail;

    ALTER TABLE field_tracker.clear_inspection_checklist_items
    DROP CONSTRAINT CK_ClearInspectionChecklistItems_CheckedRestriction;

    ALTER TABLE field_tracker.clear_inspection_checklist_items
    ADD CONSTRAINT CK_ClearInspectionChecklistItems_PassOrPendingNoDetail
    CHECK (
        passed = 0
        OR ((passed IS NULL OR passed = 1) AND deficiency_count IS NULL AND deficiency_level_type_id IS NULL)
    );

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