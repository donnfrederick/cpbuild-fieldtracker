BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'command_center_clear_inspection_statuses')
    BEGIN
        CREATE TABLE field_tracker.command_center_clear_inspection_statuses (
            id INT IDENTITY(1,1) NOT NULL,
            status_name NVARCHAR(50) NOT NULL,
            description NVARCHAR(255) NULL,
            sort_order INT NOT NULL,
            CONSTRAINT PK_command_center_clear_inspection_statuses PRIMARY KEY (id),
            CONSTRAINT UQ_command_center_clear_inspection_statuses_name UNIQUE (status_name)
        );

        CREATE UNIQUE INDEX IX_command_center_clear_inspection_statuses_name ON field_tracker.command_center_clear_inspection_statuses(status_name);
    END

    -- Insert initial status values
    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_clear_inspection_statuses WHERE status_name = 'Not Ready')
    BEGIN
        INSERT INTO field_tracker.command_center_clear_inspection_statuses (status_name, description, sort_order)
        VALUES ('Not Ready', 'Scope not ready for CI yet', 1);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_clear_inspection_statuses WHERE status_name = 'Ready')
    BEGIN
        INSERT INTO field_tracker.command_center_clear_inspection_statuses (status_name, description, sort_order)
        VALUES ('Ready', 'Marked ready, waiting for inspection', 2);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_clear_inspection_statuses WHERE status_name = 'Passed')
    BEGIN
        INSERT INTO field_tracker.command_center_clear_inspection_statuses (status_name, description, sort_order)
        VALUES ('Passed', 'Inspection passed', 3);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.command_center_clear_inspection_statuses WHERE status_name = 'Failed')
    BEGIN
        INSERT INTO field_tracker.command_center_clear_inspection_statuses (status_name, description, sort_order)
        VALUES ('Failed', 'Inspection failed, requires rework', 4);
    END

    SELECT 
        id,
        status_name,
        description,
        sort_order
    FROM field_tracker.command_center_clear_inspection_statuses
    ORDER BY sort_order;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;