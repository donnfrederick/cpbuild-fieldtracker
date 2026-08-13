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

    CREATE UNIQUE INDEX UQ_unit_scope_phase_maintask
    ON field_tracker.unit_tasks (unit_by_scope_id, phase_id)
    WHERE parent_task_id IS NULL AND task_type_id = 1;

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
        'UniqueContraintCreationUp'
    );

    THROW;
END CATCH;