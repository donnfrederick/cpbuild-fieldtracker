BEGIN TRANSACTION;

BEGIN TRY
    IF COL_LENGTH('field_tracker.image_uploads', 'markup_data') IS NOT NULL
    BEGIN
        ALTER TABLE field_tracker.image_uploads
        DROP COLUMN markup_data;

        PRINT 'Dropped markup_data column from field_tracker.image_uploads';
    END
    ELSE
    BEGIN
        PRINT 'Column field_tracker.image_uploads.markup_data does not exist - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
