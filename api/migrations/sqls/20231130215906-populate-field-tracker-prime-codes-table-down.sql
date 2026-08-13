BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the new unique constraint from the prime_code column in the prime_codes table
    ALTER TABLE field_tracker.prime_codes
    DROP CONSTRAINT UC_prime_code;

    -- Alter the data type of prime_code back to TINYINT
    ALTER TABLE field_tracker.prime_codes
    ALTER COLUMN prime_code TINYINT;

    -- Delete the inserted rows
    DELETE FROM field_tracker.prime_codes WHERE prime_code IN (6, 8, 9, 10, 12, 22, 23, 26);

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
