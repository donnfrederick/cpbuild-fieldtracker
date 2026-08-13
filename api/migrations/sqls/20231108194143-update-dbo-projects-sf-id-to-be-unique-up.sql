BEGIN TRANSACTION;

-- Check for existing duplicates before creating the unique constraint
IF NOT EXISTS (SELECT 1 FROM dbo.projects WHERE salesforce_project_id IS NOT NULL GROUP BY salesforce_project_id HAVING COUNT(*) > 1)
BEGIN
    -- No duplicates found, safe to create the unique filtered index
    CREATE UNIQUE NONCLUSTERED INDEX UQ_salesforce_project_id_filtered
    ON dbo.projects (salesforce_project_id)
    WHERE salesforce_project_id IS NOT NULL;

    COMMIT TRANSACTION;
END
ELSE
BEGIN
    -- Duplicates exist, handle them before creating the constraint
    RAISERROR('Duplicate salesforce_project_id values exist. Resolve these before adding the unique constraint.', 16, 1);
    ROLLBACK TRANSACTION;
END
