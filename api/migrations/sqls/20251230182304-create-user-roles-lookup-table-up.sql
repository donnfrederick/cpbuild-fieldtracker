BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('field_tracker') AND name = 'user_roles')
    BEGIN
        CREATE TABLE field_tracker.user_roles (
            id INT IDENTITY(1,1) NOT NULL,
            role_name NVARCHAR(50) NOT NULL,
            is_active BIT NOT NULL DEFAULT 1,
            sort_order INT NOT NULL,
            created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
            CONSTRAINT PK_user_roles PRIMARY KEY (id),
            CONSTRAINT UQ_user_roles_name UNIQUE (role_name)
        );

        CREATE UNIQUE INDEX IX_user_roles_name ON field_tracker.user_roles(role_name);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Super Admin')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Super Admin', 1, 1);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Admin')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Admin', 1, 2);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Manager')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Manager', 1, 3);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Director')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Director', 1, 4);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Executive')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Executive', 1, 5);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Project Manager')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Project Manager', 1, 6);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Install Manager')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Install Manager', 1, 7);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Team Lead')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Team Lead', 1, 8);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Worker')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Worker', 1, 9);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'QC Specialist')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('QC Specialist', 1, 10);
    END

    IF NOT EXISTS (SELECT 1 FROM field_tracker.user_roles WHERE role_name = 'Team Member')
    BEGIN
        INSERT INTO field_tracker.user_roles (role_name, is_active, sort_order)
        VALUES ('Team Member', 1, 11);
    END

    SELECT 
        id,
        role_name,
        is_active,
        sort_order,
        created_at
    FROM field_tracker.user_roles
    ORDER BY sort_order;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;