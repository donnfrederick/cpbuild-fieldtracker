BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the index first
    DROP INDEX IF EXISTS IX_departments_name ON field_tracker.departments;

    -- Drop the table
    DROP TABLE IF EXISTS field_tracker.departments;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;