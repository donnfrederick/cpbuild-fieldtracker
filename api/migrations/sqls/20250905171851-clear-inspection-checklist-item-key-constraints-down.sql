BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_ClearInspectionChecklistItems_CheckedVsPassed'
          AND parent_object_id = OBJECT_ID('field_tracker.clear_inspection_checklist_items')
    )
    BEGIN
        ALTER TABLE field_tracker.clear_inspection_checklist_items
            DROP CONSTRAINT CK_ClearInspectionChecklistItems_CheckedVsPassed;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_ClearInspectionChecklistItems_FailedRequiresDetail'
          AND parent_object_id = OBJECT_ID('field_tracker.clear_inspection_checklist_items')
    )
    BEGIN
        ALTER TABLE field_tracker.clear_inspection_checklist_items
            DROP CONSTRAINT CK_ClearInspectionChecklistItems_FailedRequiresDetail;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_ClearInspectionChecklistItems_PassOrPendingNoDetail'
          AND parent_object_id = OBJECT_ID('field_tracker.clear_inspection_checklist_items')
    )
    BEGIN
        ALTER TABLE field_tracker.clear_inspection_checklist_items
            DROP CONSTRAINT CK_ClearInspectionChecklistItems_PassOrPendingNoDetail;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_ClearInspectionChecklistItems_CheckedRestriction'
          AND parent_object_id = OBJECT_ID('field_tracker.clear_inspection_checklist_items')
    )
    BEGIN
        ALTER TABLE field_tracker.clear_inspection_checklist_items
            DROP CONSTRAINT CK_ClearInspectionChecklistItems_CheckedRestriction;
    END

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
        'ClearInspectionChecklistItemsAlterDrop'
    );

    THROW;
END CATCH;
