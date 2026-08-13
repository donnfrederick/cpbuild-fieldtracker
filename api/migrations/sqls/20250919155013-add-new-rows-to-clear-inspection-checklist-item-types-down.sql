BEGIN TRANSACTION;

BEGIN TRY
    -- Delete rows added by 20250919155013-add-new-rows-to-clear-inspection-checklist-item-types-up.sql
    DELETE F
    FROM field_tracker.clear_inspection_checklist_item_types F
    INNER JOIN field_tracker.unit_phases_by_scope U
        ON F.phase_id = U.id
    INNER JOIN field_tracker.scope_types S
        ON U.scope_type_id = S.id
    WHERE (
        -- Rough-in Door Frames (Frame Install + Clear Inspection)
        (S.scope_name = 'Rough-in Door Frames' AND U.phase_name IN ('Frame Install','Clear Inspection') AND F.item_name IN (
            '1.1 LAYOUT','1.2 FUNCTION','1.3 FRAME','1.4 HINGES','1.5 CLEANUP','1.6 OTHER'
        ))
        OR
        -- Preset Commercial Doors (Door Install + Clear Inspection)
        (S.scope_name = 'Preset Commercial Doors' AND U.phase_name IN ('Door Install','Clear Inspection') AND F.item_name IN (
            '1.1 LAYOUT','1.2 FUNCTION','1.3 HINGES','1.4 CLEANUP','1.5 OTHER','1.3 FRAME'
        ))
        OR
        -- Interior Door Hardware (Hinge, Lock, & Wallstop Install; Seal, Sweep, & Threshold Install; Clear Inspection)
        (S.scope_name = 'Interior Door Hardware' AND U.phase_name IN (
            'Hinge, Lock, & Wallstop Install',
            'Seal, Sweep, & Threshold Install',
            'Clear Inspection'
        ) AND F.item_name IN (
            '1.1 FUNCTION','1.2 HARDWARE SET SPECIFIC','1.3 HANDLE, KNOB, LEVER, or BAR','1.3 GASKETS & SEALS','1.4 GASKETS & SEALS','1.4 CLEANUP','1.5 CLEANUP','1.5 OTHER','1.6 OTHER'
        ))
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

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
        'RemoveRowsFromClearInspectionChecklistItemTypes'
    );
    THROW;
END CATCH;