BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.bulk_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        field_tracker_project_id INT NOT NULL,
        transaction_type NVARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT,
        -- Foreign Key Constraint
        CONSTRAINT fk_field_tracker_project_id_bulk_transactions FOREIGN KEY (field_tracker_project_id) REFERENCES field_tracker.projects (id),
        CONSTRAINT fk_created_by_bulk_transactions FOREIGN KEY (created_by) REFERENCES dbo.users (id)
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
        'BulkTransactionsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;