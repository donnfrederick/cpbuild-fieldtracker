CREATE TABLE field_tracker.projects (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    project_id INT NOT NULL UNIQUE,
    project_status_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    created_by INT,
    updated_at DATETIME,
    updated_by INT,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (project_status_id) REFERENCES field_tracker.project_status_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);
