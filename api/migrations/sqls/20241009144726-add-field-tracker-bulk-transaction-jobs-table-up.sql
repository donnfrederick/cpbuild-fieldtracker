BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.bulk_transaction_jobs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        job_id INT NOT NULL,
        transaction_id INT NOT NULL,
        status NVARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        created_by INT,
        updated_at DATETIME,
        updated_by INT,
        -- Foreign Key Constraints
        CONSTRAINT fk_transaction_id_job_transactions FOREIGN KEY (transaction_id) REFERENCES field_tracker.bulk_transactions (id),
        CONSTRAINT fk_created_by_job_transactions FOREIGN KEY (created_by) REFERENCES dbo.users (id),
        CONSTRAINT fk_updated_by_job_transactions FOREIGN KEY (updated_by) REFERENCES dbo.users (id)
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
        'JobTransactionsMigrationScript_Up'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
