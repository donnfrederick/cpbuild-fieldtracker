BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE dbo.users
    ADD department_id INT NULL;

    ALTER TABLE dbo.users
    ADD phone NVARCHAR(20) NULL;

    ALTER TABLE dbo.users
    ADD user_status_id INT NULL;

    ALTER TABLE dbo.users
    ADD last_login_at DATETIME2 NULL;

    EXEC('
        UPDATE dbo.users
        SET user_status_id = CASE 
            WHEN active = 1 THEN 1 
            WHEN active = 0 THEN 2 
            ELSE 1
        END;
    ');

    EXEC('
        ALTER TABLE dbo.users
        ALTER COLUMN user_status_id INT NOT NULL;
    ');

    ALTER TABLE dbo.users
    ADD CONSTRAINT DF_users_user_status_id DEFAULT 1 FOR user_status_id;

    ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_department_id 
        FOREIGN KEY (department_id) REFERENCES field_tracker.departments(id);

    ALTER TABLE dbo.users
    ADD CONSTRAINT FK_users_user_status_id 
        FOREIGN KEY (user_status_id) REFERENCES dbo.user_status_types(id);

    IF EXISTS (
        SELECT email
        FROM dbo.users
        WHERE email IS NOT NULL
        GROUP BY email
        HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR('Cannot add unique constraint UQ_users_email because duplicate email values exist in dbo.users.', 16, 1);
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.users
        ADD CONSTRAINT UQ_users_email UNIQUE (email);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;