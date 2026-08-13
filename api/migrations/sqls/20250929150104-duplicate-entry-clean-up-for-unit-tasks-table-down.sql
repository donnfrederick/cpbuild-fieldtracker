BEGIN TRANSACTION;

BEGIN TRY
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'uq_unit_scope_phase_parentless'
          AND object_id = OBJECT_ID('field_tracker.unit_tasks')
    )
    BEGIN
        DROP INDEX uq_unit_scope_phase_parentless
        ON field_tracker.unit_tasks;
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
        'DuplicateEntryCleanUpForUnitTasksTableDown'
    );

    THROW;
END CATCH;
