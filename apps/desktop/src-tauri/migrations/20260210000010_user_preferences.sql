-- Story 9.4: Disk Space & Resource Management
-- Table for persisting user preferences (temp directory, settings)
-- Simple key-value store with update timestamp

CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
