BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE field_tracker.project_rows
    ADD scope_type_id INT NULL;

    ALTER TABLE field_tracker.project_rows
    ADD CONSTRAINT fk_scope_type_id_project_rows 
    FOREIGN KEY (scope_type_id) REFERENCES field_tracker.scope_types (id);

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
        'ProjectRowsMigrationScript'
    );

    THROW;
END CATCH;