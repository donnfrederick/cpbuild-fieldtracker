BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @roughInDoorFramesId INT;
    DECLARE @presetCommercialDoorsId INT;
    DECLARE @interiorDoorHardwareId INT;

    SELECT @roughInDoorFramesId = id FROM field_tracker.scope_types WHERE scope_name = 'Rough-in Door Frames';
    SELECT @presetCommercialDoorsId = id FROM field_tracker.scope_types WHERE scope_name = 'Preset Commercial Doors';
    SELECT @interiorDoorHardwareId = id FROM field_tracker.scope_types WHERE scope_name = 'Interior Door Hardware';

    INSERT INTO field_tracker.worker_role_types
        (role_type_name, scope_type_id)
    VALUES
        ('Skilled Laborer', @roughInDoorFramesId),
        ('Apprentice', @roughInDoorFramesId),
        ('Laborer', @roughInDoorFramesId),
        ('Skilled Laborer', @presetCommercialDoorsId),
        ('Apprentice', @presetCommercialDoorsId),
        ('Laborer', @presetCommercialDoorsId),
        ('Skilled Laborer', @interiorDoorHardwareId),
        ('Apprentice', @interiorDoorHardwareId),
        ('Laborer', @interiorDoorHardwareId);

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
        'AddNewRowsToWorkerRoleTypesTable'
    );
    THROW;
END CATCH;
