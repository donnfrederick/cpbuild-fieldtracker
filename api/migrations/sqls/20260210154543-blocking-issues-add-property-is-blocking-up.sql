BEGIN TRANSACTION;

BEGIN TRY
    -- Add is_blocking column to blocking_issues table
    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'field_tracker' 
        AND TABLE_NAME = 'blocking_issues' 
        AND COLUMN_NAME = 'is_blocking'
    )
    BEGIN
        -- Add column with default value of 1 (blocking by default)
        ALTER TABLE field_tracker.blocking_issues
        ADD is_blocking BIT NOT NULL 
            CONSTRAINT DF_blocking_issues_is_blocking 
            DEFAULT (1);

        PRINT 'Successfully added is_blocking column to blocking_issues table';

        -- Use dynamic SQL to update resolved issues to is_blocking = 0
        -- This forces SQL Server to recompile and recognize the new column
        DECLARE @SQL NVARCHAR(MAX) = N'
            UPDATE field_tracker.blocking_issues
            SET is_blocking = 0
            WHERE resolved_at IS NOT NULL;
        ';
        
        EXEC sp_executesql @SQL;
        
        DECLARE @UpdatedCount INT = @@ROWCOUNT;
        PRINT 'Updated ' + CAST(@UpdatedCount AS NVARCHAR(10)) + ' resolved issues to is_blocking = 0';
    END
    ELSE
    BEGIN
        PRINT 'Column is_blocking already exists in blocking_issues table - skipping';
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
        'BlockingIssuesAddIsBlockingColumn'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;