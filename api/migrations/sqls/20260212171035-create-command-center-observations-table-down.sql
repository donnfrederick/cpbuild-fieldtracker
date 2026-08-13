BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_observations')
    BEGIN
        DECLARE @dropIndexSql NVARCHAR(MAX);

        SELECT @dropIndexSql = STRING_AGG('DROP INDEX ' + QUOTENAME(i.name) + ' ON ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ';', CHAR(10))
        FROM sys.indexes i
        JOIN sys.tables t ON i.object_id = t.object_id
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE t.object_id = OBJECT_ID('field_tracker.command_center_observations')
          AND i.name IS NOT NULL
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

        IF @dropIndexSql IS NOT NULL AND @dropIndexSql <> N''
        BEGIN
            EXEC sp_executesql @dropIndexSql;
            PRINT 'Dropped indexes on table field_tracker.command_center_observations';
        END
        DROP TABLE field_tracker.command_center_observations;
        PRINT 'Dropped table field_tracker.command_center_observations';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.command_center_observations does not exist - skipping drop';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    INSERT INTO dbo.error_log (
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        error_message
    )
    VALUES (
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        ERROR_MESSAGE()
    );

    THROW;
END CATCH;
