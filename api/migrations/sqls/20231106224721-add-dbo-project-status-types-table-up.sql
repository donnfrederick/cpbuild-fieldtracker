CREATE TABLE project_status_types (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    status_name NVARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO project_status_types (status_name) VALUES ('open');
INSERT INTO project_status_types (status_name) VALUES ('closed');
