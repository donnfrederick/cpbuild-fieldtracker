BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.blocking_issue_responsible_party_types (
        id INT PRIMARY KEY IDENTITY(1,1),

        type_name NVARCHAR(255) NOT NULL UNIQUE,

        description NVARCHAR(255) NULL,

        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.blocking_issue_responsible_party_types (type_name) VALUES 
        ('Plumbing'),
        ('Electrical'),
        ('Drywall'),
        ('Framing'),
        ('General Contractor'),
        ('CP Build');

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
        'CreateBlockingIssueResponsiblePartyTypes'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
