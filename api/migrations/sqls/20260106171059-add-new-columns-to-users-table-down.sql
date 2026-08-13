BEGIN TRANSACTION;

BEGIN TRY
    ALTER TABLE dbo.users
    DROP CONSTRAINT UQ_users_email;

    ALTER TABLE dbo.users
    DROP CONSTRAINT FK_users_user_status_id;

    ALTER TABLE dbo.users
    DROP CONSTRAINT FK_users_department_id;

    ALTER TABLE dbo.users
    DROP CONSTRAINT DF_users_user_status_id;

    ALTER TABLE dbo.users
    DROP COLUMN department_id, phone, user_status_id, last_login_at;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;