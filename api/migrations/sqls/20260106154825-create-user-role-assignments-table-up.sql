BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.user_role_assignments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_by INT NULL,
        assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_user_role_assignments_user_id
            FOREIGN KEY (user_id) REFERENCES dbo.users(id),

        CONSTRAINT FK_user_role_assignments_role_id
            FOREIGN KEY (role_id) REFERENCES field_tracker.user_roles(id),

        CONSTRAINT FK_user_role_assignments_assigned_by
            FOREIGN KEY (assigned_by) REFERENCES dbo.users(id),

        CONSTRAINT UQ_user_role_assignments_user_id_role_id
            UNIQUE (user_id, role_id)
    );

    COMMIT TRANSACTION;

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;