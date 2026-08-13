BEGIN TRANSACTION;

BEGIN TRY
    UPDATE field_tracker.scope_types
    SET 
        scope_name = CASE 
            WHEN id = 3 THEN 'Residential Interior Prehung Doors'
            WHEN id = 10 THEN 'Baseboards'
            WHEN id = 14 THEN 'Casings'
            ELSE scope_name
        END,
        ihi_enabled = CASE
            WHEN id = 14 THEN 1
            ELSE ihi_enabled
        END,
        sort_order = CASE 
            WHEN id = 1 THEN 1
            WHEN id = 2 THEN 2
            WHEN id = 3 THEN 3
            WHEN id = 4 THEN 5
            WHEN id = 5 THEN 15
            WHEN id = 6 THEN 11
            WHEN id = 7 THEN 12
            WHEN id = 8 THEN 13
            WHEN id = 9 THEN 6
            WHEN id = 10 THEN 7
            WHEN id = 11 THEN 16
            WHEN id = 12 THEN 17
            WHEN id = 13 THEN 18
            WHEN id = 14 THEN 8
            WHEN id = 15 THEN 14
            WHEN id = 16 THEN 10
            ELSE sort_order
        END
    WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

    INSERT INTO field_tracker.scope_types
        (scope_name, ihi_enabled, sort_order)
    VALUES
        ('Residential Exterior Prehung Doors', 1, 4),
        ('Shelving', 1, 9);

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
        'CreateInstallTeamsTable'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
