CREATE TABLE states (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    code NVARCHAR(2) NOT NULL UNIQUE
);

-- Seed the states table before creating the projects table
INSERT INTO states (name, code) VALUES ('Arkanas', 'AR');
INSERT INTO states (name, code) VALUES ('Arizona', 'AZ');
INSERT INTO states (name, code) VALUES ('California', 'CA');
INSERT INTO states (name, code) VALUES ('Colorado', 'CO');
INSERT INTO states (name, code) VALUES ('Florida', 'FL');
INSERT INTO states (name, code) VALUES ('Georgia', 'GA');
INSERT INTO states (name, code) VALUES ('Idaho', 'ID');
INSERT INTO states (name, code) VALUES ('Kansas', 'KS');
INSERT INTO states (name, code) VALUES ('Louisiana', 'LA');
INSERT INTO states (name, code) VALUES ('Missouri', 'MO');
INSERT INTO states (name, code) VALUES ('Montana', 'MT');
INSERT INTO states (name, code) VALUES ('North Carolina', 'NC');
INSERT INTO states (name, code) VALUES ('New Mexico', 'NM');
INSERT INTO states (name, code) VALUES ('New York', 'NY');
INSERT INTO states (name, code) VALUES ('Oregon', 'OR');
INSERT INTO states (name, code) VALUES ('Tennessee', 'TN');
INSERT INTO states (name, code) VALUES ('Texas', 'TX');
INSERT INTO states (name, code) VALUES ('Utah', 'UT');
INSERT INTO states (name, code) VALUES ('Washington', 'WA');
INSERT INTO states (name, code) VALUES ('Wyoming', 'WY');

CREATE TABLE projects (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    wip_billing_group_number NVARCHAR(150) UNIQUE,
    p6_project_id NVARCHAR(150) UNIQUE,
    project_manager_id INT,
    install_manager_id INT,
    state_id INT,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME,
    updated_by INT,
    FOREIGN KEY (project_manager_id) REFERENCES users(id),
    FOREIGN KEY (install_manager_id) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (state_id) REFERENCES states(id)
);