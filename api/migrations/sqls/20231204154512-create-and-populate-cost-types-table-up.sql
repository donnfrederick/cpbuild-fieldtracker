BEGIN TRANSACTION;

BEGIN TRY
    -- Create cost_types table
    CREATE TABLE field_tracker.cost_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        cost_type_name NVARCHAR(255) NOT NULL UNIQUE,
        cost_type_description NVARCHAR(255) NOT NULL,
        cost_type_definition NVARCHAR(500) NOT NULL
    );

    -- Populate cost_types
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('E', 'Equipment',         'Equipment, Trash, Warehouse, Storage, Pickup/Delivery');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('F', 'Freight',           'Freight');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('L', 'Field Labor',       'Trade labor for installation (IHI)');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('M', 'Material',          'Domestic Permanent materials');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('O', 'Overseas Material', 'Foreign Overseas Permanent Materials');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('S', 'Subcontractor',     'Subcontractor Costs (Labor)');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('T', 'PM/IM',             'Time & Travel');
    INSERT INTO field_tracker.cost_types (cost_type_name, cost_type_description, cost_type_definition) VALUES ('X', 'Contingency',       'An amount added to a project to allow for discretionary management purposes outside of the defined contract scope');

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