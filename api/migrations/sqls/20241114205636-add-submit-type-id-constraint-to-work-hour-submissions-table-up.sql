CREATE TRIGGER trg_EnforceSubmitTypeScopeTypeMatch
ON field_tracker.work_hour_submissions
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN field_tracker.unit_phases up ON i.phase_id = up.id
        JOIN field_tracker.projects_by_scope pbs ON i.project_by_scope_id = pbs.id
        WHERE i.submit_type_id IS NOT NULL
          AND i.phase_id IS NOT NULL
          AND up.scope_type <> pbs.scope_type
    )
    BEGIN
        RAISERROR ('Scope type of phase_id does not match the project scope type.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;