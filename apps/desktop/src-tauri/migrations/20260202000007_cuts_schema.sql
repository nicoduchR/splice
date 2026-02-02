-- Cut segments generated from text selections
CREATE TABLE IF NOT EXISTS cuts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(project_id, segment_index)
);

CREATE INDEX IF NOT EXISTS idx_cuts_project_id ON cuts(project_id);
