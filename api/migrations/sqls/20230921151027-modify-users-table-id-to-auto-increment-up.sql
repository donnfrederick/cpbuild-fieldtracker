-- Drop the existing users table if it exists
-- It turns out it is not possible to modify the id column to be auto incrementing so we have to drop the table and recreate it
IF OBJECT_ID('users', 'U') IS NOT NULL
BEGIN
    DROP TABLE users;
END

-- Create the users table
CREATE TABLE users (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    aad_user_id NVARCHAR(60) UNIQUE,
    name NVARCHAR(150) NOT NULL,
    active bit NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME,
    updated_by INT,
    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);
