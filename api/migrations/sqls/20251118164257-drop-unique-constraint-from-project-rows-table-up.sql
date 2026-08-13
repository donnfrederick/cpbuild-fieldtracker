BEGIN TRANSACTION;

BEGIN TRY
    -- Drop as a constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM sys.objects
        WHERE type_desc LIKE '%CONSTRAINT'
          AND name = 'UQ_project_rows_filtered'
          AND parent_object_id = OBJECT_ID('field_tracker.project_rows')
    )
    BEGIN
        ALTER TABLE field_tracker.project_rows
        DROP CONSTRAINT UQ_project_rows_filtered;
    END
    -- Drop as a unique index if it exists
    ELSE IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'UQ_project_rows_filtered'
          AND object_id = OBJECT_ID('field_tracker.project_rows')
    )
    BEGIN
        DROP INDEX UQ_project_rows_filtered ON field_tracker.project_rows;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    INSERT INTO dbo.error_log (
        error_message,
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        user_name,
        app_name
    )
    VALUES (
        ERROR_MESSAGE(),
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        SUSER_SNAME(),
        'UniqueConstraintDropMigration'
    );

    THROW;
END CATCH;