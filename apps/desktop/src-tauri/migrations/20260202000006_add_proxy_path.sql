-- Add proxy_path column to projects table for video proxy support
ALTER TABLE projects ADD COLUMN proxy_path TEXT;
