CREATE TRIGGER trg_ValidatePhaseIdMatch
ON field_tracker.clear_inspection_checklist_items
INSTEAD OF INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        JOIN field_tracker.unit_tasks AS tasks
            ON tasks.id = i.task_id
        JOIN field_tracker.clear_inspection_checklist_items_types AS item_types
            ON item_types.id = i.item_type_id
        WHERE tasks.phase_id != item_types.phase_id
    )
    BEGIN
        THROW 50000, 'Phase ID mismatch between task_id and item_type_id.', 1;
    END;

    INSERT INTO field_tracker.clear_inspection_checklist_items (
        task_id, item_type_id, is_checked, checked_by, checked_at,
        created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
    )
    SELECT 
        task_id, item_type_id, is_checked, checked_by, checked_at,
        created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
    FROM inserted;
END;