CREATE TABLE field_tracker.project_status_types (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    status_name NVARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO field_tracker.project_status_types (status_name) VALUES ('active');
INSERT INTO field_tracker.project_status_types (status_name) VALUES ('completed');
INSERT INTO field_tracker.project_status_types (status_name) VALUES ('deleted');