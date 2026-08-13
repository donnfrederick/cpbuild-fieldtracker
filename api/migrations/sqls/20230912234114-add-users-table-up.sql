CREATE TABLE users (
    id INT PRIMARY KEY,
    aad_user_id NVARCHAR(60),
    name NVARCHAR(150) NOT NULL,
    active bit NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME,
    updated_by INT,
    FOREIGN KEY (updated_by)
        REFERENCES users(id)
);
