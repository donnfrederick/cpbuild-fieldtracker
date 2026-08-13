BEGIN TRANSACTION;

BEGIN TRY
CREATE TABLE field_tracker.task_types (
    id INT PRIMARY KEY IDENTITY(1,1),
    type_name NVARCHAR(255) UNIQUE NOT NULL,
    description NVARCHAR(255) NULL DEFAULT NULL,
    task_level_id INT NOT NULL,
    work_classification_id INT,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_TaskLevel FOREIGN KEY (task_level_id) REFERENCES field_tracker.task_level_types(id),
    CONSTRAINT FK_WorkClassification FOREIGN KEY (work_classification_id) REFERENCES field_tracker.work_classification_types(id)
);

INSERT INTO field_tracker.task_types (type_name, description, task_level_id, work_classification_id, is_active)
VALUES
    ('Main', 'Main work tasks', 
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Unit Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Modification', 'Changes to planned work',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Unit Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Trade Damage Repair', 'Repairs to damage done by other trades',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Unit Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Punch Work', 'Follow-up work for corrections',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Unit Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Punch Work'), 1),
        
    ('Staging', 'Placing necessary material',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Project Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Offloading', 'Offloading materials from trucks',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Project Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Forklift Operation', 'Forklift operation during offloading or staging',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Project Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Productive'), 1),
        
    ('Training', 'Employee skill development',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Project Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Non-productive'), 1),
        
    ('Meeting', 'Project meetings and planning',
        (SELECT id FROM field_tracker.task_level_types WHERE type_name = 'Project Level'),
        (SELECT id FROM field_tracker.work_classification_types WHERE type_name = 'Non-productive'), 1);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF (@@TRANCOUNT > 0)
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Log the error to the error_log table
    INSERT INTO dbo.error_log (
        error_message,
        error_number,
        error_severity,
        error_state,
        error_procedure,
        error_line,
        user_name,
        app_name
    ) VALUES (
        ERROR_MESSAGE(),
        ERROR_NUMBER(),
        ERROR_SEVERITY(),
        ERROR_STATE(),
        ERROR_PROCEDURE(),
        ERROR_LINE(),
        SUSER_SNAME(),
        'AddTileScopeScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;