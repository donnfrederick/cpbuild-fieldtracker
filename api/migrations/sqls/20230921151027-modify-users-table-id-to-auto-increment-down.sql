-- first drop the table
IF OBJECT_ID('users', 'U') IS NOT NULL
BEGIN
    DROP TABLE users;
END

-- then recreate it like it was before the migration
CREATE TABLE users (
    id INT PRIMARY KEY,
    aad_user_id NVARCHAR(60) UNIQUE,
    name NVARCHAR(150) NOT NULL,
    active bit NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME,
    updated_by INT,
    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);