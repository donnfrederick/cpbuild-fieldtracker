BEGIN TRANSACTION;

-- Check if the unique constraint exists before dropping it
IF OBJECT_ID('dbo.UQ_salesforce_project_id', 'UQ') IS NOT NULL
BEGIN
    -- Unique constraint exists, drop it
    ALTER TABLE dbo.projects
    DROP CONSTRAINT UQ_salesforce_project_id;
    COMMIT TRANSACTION;
END
ELSE
BEGIN
    -- Unique constraint doesn't exist, handle the error
    BEGIN TRY
        THROW 51000, 'Unique constraint UQ_salesforce_project_id does not exist. Cannot roll back.', 1;
    END TRY
    BEGIN CATCH
        -- Handle the error here, you can log it or take other appropriate actions.
        PRINT 'Error: ' + ERROR_MESSAGE();
        ROLLBACK TRANSACTION;
    END CATCH
END
