BEGIN TRANSACTION;

BEGIN TRY
    -- Add unique constraint to ensure uniqueness of specific columns
    ALTER TABLE field_tracker.project_rows
    ADD CONSTRAINT UQ_project_rows
    UNIQUE (
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
    );

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
        'AddUniqueConstraintMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
