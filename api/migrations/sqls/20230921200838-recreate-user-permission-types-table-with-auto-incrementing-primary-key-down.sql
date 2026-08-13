-- first drop the table
IF OBJECT_ID('user_permission_types', 'U') IS NOT NULL
BEGIN
    DROP TABLE user_permission_types;
END

-- then recreate it like it was before the migration
CREATE TABLE user_permission_types (
    id INT PRIMARY KEY,
    name NVARCHAR(65) NOT NULL,
);