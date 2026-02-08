-- Story 9.2: Auto-Save & Crash Recovery
-- Table for persisting project state (timeline position, volume, clean shutdown flag)
-- Used for crash detection and project recovery on restart

CREATE TABLE IF NOT EXISTS project_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    project_id TEXT,
    timeline_position REAL DEFAULT 0.0,
    volume REAL DEFAULT 1.0,
    last_saved_at INTEGER,
    was_clean_shutdown INTEGER DEFAULT 0
);
