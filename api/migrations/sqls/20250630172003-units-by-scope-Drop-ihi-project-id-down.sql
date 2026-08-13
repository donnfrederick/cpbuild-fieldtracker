BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'field_tracker'
          AND TABLE_NAME = 'units_by_scope'
          AND COLUMN_NAME = 'ihi_project_id'
    )
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        ADD ihi_project_id INT NULL;
    END

    COMMIT;
END TRY
BEGIN CATCH
    ROLLBACK;
    PRINT 'Error adding column ihi_project_id: ' + ERROR_MESSAGE();
END CATCH;
