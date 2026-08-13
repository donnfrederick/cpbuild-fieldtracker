-- Step 1: Recursive CTE to find the root_main_task for each task
WITH TaskHierarchy AS (
    -- Anchor: Start with tasks that have a parent
    SELECT
        child.id AS child_id,
        parent.id AS root_id,
        parent.task_type_id,
        parent.parent_task_id
    FROM field_tracker.unit_tasks AS child
    JOIN field_tracker.unit_tasks AS parent
        ON child.parent_task_id = parent.id

    UNION ALL

    -- Recursive: Traverse up the hierarchy
    SELECT
        th.child_id,
        parent.id AS root_id,
        parent.task_type_id,
        parent.parent_task_id
    FROM TaskHierarchy th
    JOIN field_tracker.unit_tasks AS parent
        ON th.parent_task_id = parent.id
)
-- Step 2: Pick the correct root for each child
-- The one with task_type_id = 1 AND parent_task_id IS NULL
, ResolvedRoots AS (
    SELECT child_id, root_id
    FROM TaskHierarchy
    WHERE task_type_id = 1 AND parent_task_id IS NULL
)
-- Step 3: Update the root_main_task_id in unit_tasks
UPDATE ut
SET root_main_task_id = rr.root_id
FROM field_tracker.unit_tasks ut
JOIN ResolvedRoots rr ON ut.id = rr.child_id;