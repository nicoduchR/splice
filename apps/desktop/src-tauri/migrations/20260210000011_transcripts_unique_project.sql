-- Ensure one transcript row per project.
-- Keep the latest transcript by created_at (then rowid) when duplicates exist.

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY project_id
            ORDER BY created_at DESC, rowid DESC
        ) AS rn
    FROM transcripts
)
DELETE FROM transcript_words
WHERE transcript_id IN (
    SELECT id
    FROM ranked
    WHERE rn > 1
);

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY project_id
            ORDER BY created_at DESC, rowid DESC
        ) AS rn
    FROM transcripts
)
DELETE FROM transcripts
WHERE id IN (
    SELECT id
    FROM ranked
    WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_project_unique
ON transcripts(project_id);
