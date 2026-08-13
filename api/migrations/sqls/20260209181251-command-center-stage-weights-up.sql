BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================================
       Create command_center_stage_weights table
       This table stores progress weights for each stage in the Command Center workflow
       ========================================================= */
    CREATE TABLE field_tracker.command_center_stage_weights (
        stage_id INT NOT NULL,
        stage_name NVARCHAR(50) NOT NULL,
        weight_percentage INT NOT NULL,
        CONSTRAINT PK_command_center_stage_weights PRIMARY KEY (stage_id),
        CONSTRAINT FK_command_center_stage_weights_unit_phases_by_scope 
            FOREIGN KEY (stage_id) REFERENCES field_tracker.unit_phases_by_scope(id),
        CONSTRAINT CHK_weight_percentage_range 
            CHECK (weight_percentage >= 0 AND weight_percentage <= 100)
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;