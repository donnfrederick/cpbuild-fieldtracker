BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.departments (
        id INT IDENTITY(1,1) NOT NULL,
        department_name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL,
        CONSTRAINT PK_departments PRIMARY KEY (id),
        CONSTRAINT UQ_departments_name UNIQUE (department_name)
    );

    CREATE UNIQUE INDEX IX_departments_name ON field_tracker.departments(department_name);


    INSERT INTO field_tracker.departments (department_name, description) VALUES
        ('Business Intelligence', ''),
        ('Software', ''),
        ('Sales', ''),
        ('Marketing', ''),
        ('Business Development', ''),
        ('Warehouse', ''),
        ('Operations', ''),
        ('Estimating', ''),
        ('Quality Control', ''),
        ('Install', ''),
        ('Project Coordination', ''),
        ('Project Management', ''),
        ('Recruiting', ''),
        ('Finance', ''),
        ('Customer Success', ''),
        ('Scheduling', ''),
        ('Controls', ''),
        ('Human Resources', ''),
        ('Sourcing', ''),
        ('Legal', '');

    SELECT COUNT(*) AS department_count FROM field_tracker.departments;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;