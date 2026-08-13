BEGIN TRANSACTION;

BEGIN TRY
    -- Remove is_blocking column from blocking_issues table
    IF EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'field_tracker' 
        AND TABLE_NAME = 'blocking_issues' 
        AND COLUMN_NAME = 'is_blocking'
    )
    BEGIN
        -- First, drop the default constraint if it exists
        DECLARE @ConstraintName NVARCHAR(200);
        SELECT @ConstraintName = dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = 'field_tracker'
        AND t.name = 'blocking_issues'
        AND c.name = 'is_blocking';

        IF @ConstraintName IS NOT NULL
        BEGIN
            DECLARE @SQL NVARCHAR(MAX) = 'ALTER TABLE field_tracker.blocking_issues DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
            EXEC sp_executesql @SQL;
            PRINT 'Dropped default constraint: ' + @ConstraintName;
        END

        -- Now drop the column
        ALTER TABLE field_tracker.blocking_issues
        DROP COLUMN is_blocking;

        PRINT 'Successfully removed is_blocking column from blocking_issues table';
    END
    ELSE
    BEGIN
        PRINT 'Column is_blocking does not exist in blocking_issues table - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error to the error_log table
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
        'BlockingIssuesRemoveIsBlockingColumn'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;