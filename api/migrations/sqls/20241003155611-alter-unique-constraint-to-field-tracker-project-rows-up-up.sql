BEGIN TRANSACTION;

BEGIN TRY
    -- Remove the previous unique constraint
    ALTER TABLE field_tracker.project_rows
    DROP CONSTRAINT UQ_project_rows;

    -- Add a new unique constraint considering deleted_at column
    CREATE UNIQUE INDEX UQ_project_rows_filtered
    ON field_tracker.project_rows (
        field_tracker_project_id,
        building,
        building_level,
        area,
        scheme,
        unit,
        unit_type,
        scope_detail_code_id,
        location_type_id,
        cost_type_id,
        scope_type_id
    )
    WHERE deleted_at IS NULL;

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
        'ModifyUniqueConstraintMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;