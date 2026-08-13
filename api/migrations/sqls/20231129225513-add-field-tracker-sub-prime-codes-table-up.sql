BEGIN TRANSACTION;

BEGIN TRY
    -- Create sub_prime_code table
    CREATE TABLE field_tracker.sub_prime_codes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sub_prime_code INT NOT NULL,
        sub_prime_code_description NVARCHAR(255) NOT NULL,
        prime_code_id INT NOT NULL,
        -- Foreign Key Constraint
        CONSTRAINT fk_prime_code FOREIGN KEY (prime_code_id) REFERENCES field_tracker.prime_codes (id),
        -- Composite Unique Constraint
        CONSTRAINT uc_prime_sub_prime UNIQUE (prime_code_id, sub_prime_code)
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
        'SubPrimeCodeMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;