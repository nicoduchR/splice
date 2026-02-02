-- Selections storage schema for Splice
-- Date: 2026-02-02
-- Story: 3.1 - Text Selection & Highlighting

-- Selections table
CREATE TABLE IF NOT EXISTS selections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    start_word_index INTEGER NOT NULL,
    end_word_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index pour recherche rapide par project
CREATE INDEX IF NOT EXISTS idx_selections_project_id
ON selections(project_id);
