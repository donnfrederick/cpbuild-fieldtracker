BEGIN TRANSACTION;

BEGIN TRY
    IF COL_LENGTH('field_tracker.image_uploads', 'markup_data') IS NULL
    BEGIN
        ALTER TABLE field_tracker.image_uploads
        ADD markup_data NVARCHAR(MAX) NULL;

        PRINT 'Added markup_data column to field_tracker.image_uploads';
    END
    ELSE
    BEGIN
        PRINT 'Column field_tracker.image_uploads.markup_data already exists - skipping';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
