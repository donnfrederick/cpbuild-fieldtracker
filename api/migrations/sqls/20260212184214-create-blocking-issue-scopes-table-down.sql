BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (
        SELECT 1
        FROM sys.tables
        WHERE schema_id = SCHEMA_ID('field_tracker')
          AND name = 'blocking_issue_scopes'
    )
    BEGIN
        DROP TABLE field_tracker.blocking_issue_scopes;
        PRINT 'Dropped table field_tracker.blocking_issue-scopes';
    END
    ELSE
    BEGIN
        PRINT 'Table field_tracker.blocking_issue_scopes does not exist - skipping drop';
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    PRINT 'Error during down migration for field_tracker.blocking_issue_scopes: '
        + ERROR_MESSAGE()
        + ' (Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10))
        + ', Severity: ' + CAST(ERROR_SEVERITY() AS NVARCHAR(10))
        + ', State: ' + CAST(ERROR_STATE() AS NVARCHAR(10))
        + ', Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';

    RAISERROR (
        'Down migration failed for field_tracker.blocking_issue_scopes: %s',
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_MESSAGE()
    );
END CATCH;
