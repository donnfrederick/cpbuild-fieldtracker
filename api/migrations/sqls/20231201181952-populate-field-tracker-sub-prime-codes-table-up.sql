BEGIN TRANSACTION;

BEGIN TRY
    -- Drop the composite unique constraint
    ALTER TABLE field_tracker.sub_prime_codes
    DROP CONSTRAINT uc_prime_sub_prime;

    -- Alter the data type of sub_prime_code to VARCHAR(4)
    ALTER TABLE field_tracker.sub_prime_codes
    ALTER COLUMN sub_prime_code VARCHAR(10) NOT NULL;

    -- Reapply the composite unique constraint
    ALTER TABLE field_tracker.sub_prime_codes
    ADD CONSTRAINT uc_prime_sub_prime UNIQUE (prime_code_id, sub_prime_code);

    -- Populate sub_prime_codes table with a subquery to get prime_code_id
    INSERT INTO field_tracker.sub_prime_codes (sub_prime_code, sub_prime_code_description, prime_code_id)
    VALUES
    ('0622', 'Millwork', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0622', 2))),
    ('0641', 'Architectural Woodwork', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0641', 2))),
    ('0646', 'Wood Trim', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0646', 2))),
    ('0814', 'Wood Doors', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0814', 2))),
    ('0871', 'Door Hardware', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0871', 2))),
    ('0883', 'Door Hardware', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0883', 2))),
    ('0930', 'Tiling', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0930', 2))),
    ('0960', 'Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0960', 2))),
    ('0962', 'Specialty Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0962', 2))),
    ('0964', 'Wood Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0964', 2))),
    ('0965', 'Resilient Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0965', 2))),
    ('0966', 'Terrazzo Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0966', 2))),
    ('0967', 'Fluid-Applied Flooring', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0967', 2))),
    ('0968', 'Carpeting', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('0968', 2))),
    ('1028', 'Bath Accessories', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1028', 2))),
    ('1221', 'Window Blinds', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1221', 2))),
    ('1230', 'Casework', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1230', 2))),
    ('1232', 'Manufactured Wood Casework', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1232', 2))),
    ('1234', 'Manufactured Plastic Casework', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1234', 2))),
    ('1235', 'Specialty Casework', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1235', 2))),
    ('1236', 'Countertops', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('1236', 2))),
    ('2241', 'Plumbing Fixture', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('2241', 2))),
    ('2334', 'Fans', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('2334', 2))),
    ('2651', 'Interior Lighting', (SELECT id FROM field_tracker.prime_codes WHERE prime_code = LEFT('2651', 2)))


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