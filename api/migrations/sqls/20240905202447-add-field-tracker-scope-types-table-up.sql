CREATE TABLE field_tracker.scope_types (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    scope_name NVARCHAR(255) NOT NULL UNIQUE,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    created_by NVARCHAR(255)
);

-- Insert scope types into the scope_types table
INSERT INTO field_tracker.scope_types (scope_name, is_active, created_at, created_by) 
VALUES 
('Cabinetry', 1, GETDATE(), NULL),
('Countertops', 1, GETDATE(), NULL),
('Residential Doors', 1, GETDATE(), NULL),
('Commercial Doors', 1, GETDATE(), NULL),
('Broadloom Carpet', 1, GETDATE(), NULL),
('LVP', 1, GETDATE(), NULL),
('LVT', 1, GETDATE(), NULL);