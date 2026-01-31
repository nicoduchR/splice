-- Initial database schema for Splice MVP
-- Date: 2026-01-31
-- Story: 1.3 - State Management & Local Storage Setup

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Index for querying recent projects
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Schema version tracking (managed by sqlx)
CREATE TABLE IF NOT EXISTS _sqlx_migrations (
    version BIGINT PRIMARY KEY,
    description TEXT NOT NULL,
    installed_on INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    checksum BLOB NOT NULL,
    execution_time INTEGER NOT NULL
);
