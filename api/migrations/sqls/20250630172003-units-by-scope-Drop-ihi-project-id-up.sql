BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'field_tracker'
          AND TABLE_NAME = 'units_by_scope'
          AND COLUMN_NAME = 'ihi_project_id'
    )
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        DROP COLUMN ihi_project_id;
    END

    COMMIT;
END TRY
BEGIN CATCH
    ROLLBACK;
    PRINT 'Error dropping column ihi_project_id: ' + ERROR_MESSAGE();
END CATCH;
