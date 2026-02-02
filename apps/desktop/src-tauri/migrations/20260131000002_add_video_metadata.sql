-- Migration: Add video metadata columns
-- Date: 2026-01-31
-- Story: 1.6 - Video Import Backend Processing & Storage
-- Description: Adds width, height, file_size_bytes, and codec columns to projects table

-- Add video metadata columns (all nullable for backward compatibility)
ALTER TABLE projects ADD COLUMN width INTEGER;
ALTER TABLE projects ADD COLUMN height INTEGER;
ALTER TABLE projects ADD COLUMN file_size_bytes INTEGER;
ALTER TABLE projects ADD COLUMN codec TEXT;

-- Columns are NULLABLE to support existing projects without metadata
-- Existing projects will have NULL values until they are reimported
