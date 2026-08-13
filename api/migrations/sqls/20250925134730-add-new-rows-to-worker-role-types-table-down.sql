BEGIN TRANSACTION;

BEGIN TRY
    DELETE wrt
    FROM field_tracker.worker_role_types wrt
    INNER JOIN field_tracker.scope_types st ON wrt.scope_type_id = st.id
    WHERE st.scope_name IN (
        'Rough-in Door Frames',
        'Preset Commercial Doors',
        'Interior Door Hardware'
    )
    AND wrt.role_type_name IN ('Skilled Laborer', 'Apprentice', 'Laborer');

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
        'RemoveNewRowsFromWorkerRoleTypesTable'
    );
    THROW;
END CATCH;
