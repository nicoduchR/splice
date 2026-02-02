-- Create video_projects table
CREATE TABLE IF NOT EXISTS video_projects (
    id TEXT PRIMARY KEY NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    duration_seconds REAL NOT NULL DEFAULT 0.0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Create index on created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_video_projects_created_at ON video_projects(created_at DESC);
