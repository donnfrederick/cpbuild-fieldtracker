-- first drop the table so it can be added again with the auto incrementing primary key
IF OBJECT_ID('user_permission_types', 'U') IS NOT NULL
BEGIN
    DROP TABLE user_permission_types;
END

-- create the user_permission_types table
CREATE TABLE user_permission_types (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    name NVARCHAR(65) NOT NULL,
);