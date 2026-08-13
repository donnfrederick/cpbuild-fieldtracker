BEGIN TRANSACTION;

BEGIN TRY
    IF OBJECT_ID('tempdb..#DuplicateTasks') IS NOT NULL
        DROP TABLE #DuplicateTasks;

    ;WITH RankedTasks AS (
        SELECT id, unit_by_scope_id, phase_id, parent_task_id,
               ROW_NUMBER() OVER (
                   PARTITION BY unit_by_scope_id, phase_id
                   ORDER BY id ASC
               ) AS rn
        FROM field_tracker.unit_tasks
        WHERE task_type_id = 1
    ),
    CanonicalTasks AS (
        SELECT unit_by_scope_id, phase_id, MIN(id) AS canonical_id
        FROM RankedTasks
        WHERE rn = 1
        GROUP BY unit_by_scope_id, phase_id
    )
    SELECT rt.id AS duplicate_id,
        ct.canonical_id
    INTO #DuplicateTasks
    FROM RankedTasks rt
    JOIN CanonicalTasks ct
      ON rt.unit_by_scope_id = ct.unit_by_scope_id
      AND rt.phase_id = ct.phase_id
    WHERE rt.rn > 1
      AND rt.parent_task_id IS NULL
      AND (SELECT parent_task_id FROM field_tracker.unit_tasks WHERE id = ct.canonical_id) IS NULL;

    UPDATE ut
    SET ut.parent_task_id = dt.canonical_id
    FROM field_tracker.unit_tasks ut
    JOIN #DuplicateTasks dt
    ON ut.parent_task_id = dt.duplicate_id;

    DELETE cici
    FROM field_tracker.clear_inspection_checklist_items cici
    JOIN #DuplicateTasks dt ON cici.task_id = dt.duplicate_id;

    DELETE whs
    FROM field_tracker.work_hour_submissions whs
    JOIN #DuplicateTasks dt ON whs.task_id = dt.duplicate_id;

    DELETE bi
    FROM field_tracker.blocking_issues bi
    JOIN #DuplicateTasks dt ON bi.task_id = dt.duplicate_id;

    DELETE ut
    FROM field_tracker.unit_tasks ut
    JOIN #DuplicateTasks dt ON ut.id = dt.duplicate_id;

    CREATE UNIQUE INDEX uq_unit_scope_phase_parentless
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
        'DuplicateEntryCleanUpForUnitTasksTableUp'
    );

    THROW;
END CATCH;