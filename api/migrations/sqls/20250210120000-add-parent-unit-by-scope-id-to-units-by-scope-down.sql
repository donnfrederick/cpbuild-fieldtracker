BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_units_by_scope_parent_unit_by_scope_id'
          AND object_id = OBJECT_ID('field_tracker.units_by_scope')
    )
    BEGIN
        DROP INDEX IX_units_by_scope_parent_unit_by_scope_id ON field_tracker.units_by_scope;
        PRINT 'Dropped index IX_units_by_scope_parent_unit_by_scope_id';
    END

    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_units_by_scope_parent_unit_by_scope_id'
          AND parent_object_id = OBJECT_ID('field_tracker.units_by_scope')
    )
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        DROP CONSTRAINT FK_units_by_scope_parent_unit_by_scope_id;
        PRINT 'Dropped FK FK_units_by_scope_parent_unit_by_scope_id';
    END

    IF COL_LENGTH('field_tracker.units_by_scope', 'parent_unit_by_scope_id') IS NOT NULL
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        DROP COLUMN parent_unit_by_scope_id;
        PRINT 'Dropped column parent_unit_by_scope_id';
    END

    COMMIT TRANSACTION;
    PRINT 'Migration 20250210120000-add-parent-unit-by-scope-id-to-units-by-scope DOWN completed successfully';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT 'Error: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
