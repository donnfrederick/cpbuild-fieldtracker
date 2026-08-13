BEGIN TRANSACTION;

BEGIN TRY
    -- Drop foreign key constraints
    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_project_id;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_scope_type_id;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_status_id;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_team_lead_id;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_created_by;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_updated_by;

    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT fk_projects_by_scope_deleted_by;

    -- Drop unique constraint on project_id and scope_type_id combination
    ALTER TABLE field_tracker.projects_by_scope
    DROP CONSTRAINT UQ_project_id_and_scope_type_id;

    -- Drop the projects_by_scope table
    DROP TABLE field_tracker.projects_by_scope;

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
        'projectsByScopeDownMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;