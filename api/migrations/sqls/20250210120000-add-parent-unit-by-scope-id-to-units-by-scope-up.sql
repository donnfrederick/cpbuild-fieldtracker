BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('field_tracker.units_by_scope', 'parent_unit_by_scope_id') IS NULL
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        ADD parent_unit_by_scope_id INT NULL;
        PRINT 'Added column field_tracker.units_by_scope.parent_unit_by_scope_id';
    END
    ELSE
    BEGIN
        PRINT 'Column parent_unit_by_scope_id already exists - skipping';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_units_by_scope_parent_unit_by_scope_id'
          AND parent_object_id = OBJECT_ID('field_tracker.units_by_scope')
    )
    BEGIN
        ALTER TABLE field_tracker.units_by_scope
        ADD CONSTRAINT FK_units_by_scope_parent_unit_by_scope_id
        FOREIGN KEY (parent_unit_by_scope_id)
        REFERENCES field_tracker.units_by_scope(id);
        PRINT 'Added FK FK_units_by_scope_parent_unit_by_scope_id';
    END
    ELSE
    BEGIN
        PRINT 'FK FK_units_by_scope_parent_unit_by_scope_id already exists - skipping';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_units_by_scope_parent_unit_by_scope_id'
          AND object_id = OBJECT_ID('field_tracker.units_by_scope')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_units_by_scope_parent_unit_by_scope_id
        ON field_tracker.units_by_scope (parent_unit_by_scope_id)
        WHERE deleted_at IS NULL;
        PRINT 'Created filtered index IX_units_by_scope_parent_unit_by_scope_id';
    END
    ELSE
    BEGIN
        PRINT 'Index IX_units_by_scope_parent_unit_by_scope_id already exists - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    PRINT 'Error: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
