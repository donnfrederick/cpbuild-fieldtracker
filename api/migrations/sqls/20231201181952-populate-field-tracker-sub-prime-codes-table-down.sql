BEGIN TRANSACTION;

BEGIN TRY
    -- Delete the inserted rows from the sub_prime_codes table
    -- Adjust the WHERE clause as needed to match the inserted data
    DELETE FROM field_tracker.sub_prime_codes WHERE sub_prime_code IN
    ('0622', '0641', '0646', '0814', '0871', '0883', '0930', '0960', '0962', '0964', '0965', '0966', '0967', '0968', '1028', '1221', '1230', '1232', '1234', '1235', '1236', '2241', '2334', '2651');

    -- Drop the unique constraint from the sub_prime_codes table
    ALTER TABLE field_tracker.sub_prime_codes
    DROP CONSTRAINT uc_prime_sub_prime;

    -- Revert the data type of sub_prime_code back to TINYINT
    ALTER TABLE field_tracker.sub_prime_codes
    ALTER COLUMN sub_prime_code TINYINT NOT NULL;

    -- Reapply the original unique constraint to the sub_prime_codes table
    ALTER TABLE field_tracker.sub_prime_codes
    ADD CONSTRAINT uc_prime_sub_prime UNIQUE (prime_code_id, sub_prime_code);

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
