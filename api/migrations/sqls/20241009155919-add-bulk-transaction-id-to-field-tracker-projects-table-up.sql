BEGIN TRANSACTION;

BEGIN TRY
    -- Drop transaction_id and transaction_type columns separately
    ALTER TABLE field_tracker.projects 
    DROP COLUMN transaction_id;
    
    ALTER TABLE field_tracker.projects 
    DROP COLUMN transaction_type;

    -- Add bulk_transaction_id column
    ALTER TABLE field_tracker.projects 
    ADD bulk_transaction_id INT NULL;

    -- Add foreign key constraint for bulk_transaction_id
    ALTER TABLE field_tracker.projects 
    ADD CONSTRAINT fk_bulk_transaction_id_projects FOREIGN KEY (bulk_transaction_id) REFERENCES field_tracker.bulk_transactions(id);

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
        'ModifyProjectsTableMigration_Up'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;