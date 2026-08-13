BEGIN TRANSACTION;

BEGIN TRY
    CREATE TABLE field_tracker.unit_by_scope_status_types (
        id INT PRIMARY KEY IDENTITY(1,1),
        status_name NVARCHAR(255) NOT NULL UNIQUE,
        description NVARCHAR(255) NULL DEFAULT NULL,
        is_active BIT NOT NULL DEFAULT 1
    );

    INSERT INTO field_tracker.unit_by_scope_status_types (status_name, description)
    VALUES
        ('Unassigned', 'Initial state for a unit which let’s the project rows table know if the row should be locked or not to editing. Any other state would indicate that something has been assigned or the staging date has not been set.'),
        ('Not Ready', 'Main task does not have a worker assigned or is not scheduled, or a blocking phase is not completed.'),
        ('Ready', 'All blocking phases have been completed, and the main task for the phase has been assigned and scheduled.'),
        ('Started', 'The main task has been started, or there are still punch work tasks that are not completed for the phase’s main task.'),
        ('Submitted', 'The main task or current child puch task has been submitted'),
        ('Rework', 'The main task or a punch work child subtask has been created  but not yet submitted for review.'),
        ('Blocked', 'A blocking issue has been created for the unit and work has been paused regardless of the current phase.'),
        ('Complete', 'All tasks and child tasks associated with the phase have been submitted and the most current phase specific task or subtask has passed the review.'),
        ('Removed', 'If a unit was set to the IHI team but before work started it was set to a team other than IHI, we set the deleted_at value and give it this “removed” status.')

    COMMIT TRANSACTION;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
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
        'scopePhasesRoleRequirementsMigrationScript'
    );

    -- Re-throw the error to the calling application
    THROW;
END CATCH;
