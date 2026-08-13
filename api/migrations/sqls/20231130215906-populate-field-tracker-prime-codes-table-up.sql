BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the unique constraint from the sub_prime_codes table
    ALTER TABLE field_tracker.sub_prime_codes
    DROP CONSTRAINT uc_prime_sub_prime;

    -- Declare a variable to hold the constraint name
    DECLARE @ConstraintName NVARCHAR(256);

    -- Find the name of the unique constraint on the prime_code column
    SELECT @ConstraintName = tc.constraint_name
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
    JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ccu
    ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'prime_codes'
    AND ccu.column_name = 'prime_code'
    AND tc.constraint_type = 'UNIQUE';

    -- Check if a constraint name was found
    IF @ConstraintName IS NOT NULL
    BEGIN
        -- Drop the unique constraint using dynamic SQL
        EXEC('ALTER TABLE field_tracker.prime_codes DROP CONSTRAINT ' + @ConstraintName);
    END

    -- Alter the data type of prime_code to VARCHAR and set NOT NULL
    ALTER TABLE field_tracker.prime_codes
    ALTER COLUMN prime_code VARCHAR(4) NOT NULL;

    -- Add a UNIQUE constraint to the prime_code column
    ALTER TABLE field_tracker.prime_codes
    ADD CONSTRAINT UC_prime_code UNIQUE (prime_code);

    -- Reapply the unique constraint to the sub_prime_codes table
    ALTER TABLE field_tracker.sub_prime_codes
    ADD CONSTRAINT uc_prime_sub_prime UNIQUE (prime_code_id, sub_prime_code);

    -- Populate prime_code table
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('06', 'Wood, Plastics, and Composites');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('08', 'Openings');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('09', 'Finishes');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('10', 'Specialties');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('12', 'Furnishings');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('22', 'Plumbing');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('23', 'HVAC');
    INSERT INTO field_tracker.prime_codes (prime_code, prime_code_description) VALUES ('26', 'Electrical');

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