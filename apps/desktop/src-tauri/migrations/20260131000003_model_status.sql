-- Migration: Model Status Tracking
-- Story: 2-1-parakeet-model-download-infrastructure
-- Purpose: Track ML model download status and metadata

CREATE TABLE IF NOT EXISTS model_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('missing', 'downloading', 'ready', 'corrupted')),
    total_size_bytes INTEGER NOT NULL,
    downloaded_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Insert initial record for Parakeet model
INSERT INTO model_status (name, version, status, total_size_bytes)
VALUES ('parakeet-tdt-0.6b-v3', 'v3', 'missing', 670000000)
ON CONFLICT(name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_model_status_name ON model_status(name);
