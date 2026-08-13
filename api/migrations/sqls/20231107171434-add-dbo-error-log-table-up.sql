
CREATE TABLE error_log (
    id INT PRIMARY KEY IDENTITY(1,1),
    error_time DATETIME NOT NULL DEFAULT GETDATE(),
    error_message NVARCHAR(4000),
    error_number INT,
    error_severity INT,
    error_state INT,
    error_procedure NVARCHAR(200),
    error_line INT,
    user_name NVARCHAR(128),
    app_name NVARCHAR(128),
    INDEX idx_error_time NONCLUSTERED (error_time)
);
