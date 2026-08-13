BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (
        SELECT 1
        FROM sys.objects o
        JOIN sys.schemas s ON o.schema_id = s.schema_id
        WHERE o.name = 'UQ_project_rows_filtered'
          AND s.name = 'field_tracker'
          AND o.type = 'UQ'
    )
    BEGIN
        ALTER TABLE field_tracker.project_rows
        ADD CONSTRAINT UQ_project_rows_filtered UNIQUE (project_id, row_id, filtered);
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