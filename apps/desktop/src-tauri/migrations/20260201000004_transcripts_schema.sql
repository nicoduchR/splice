-- Transcripts storage schema for Splice MVP
-- Date: 2026-02-01
-- Story: 2.3 - Transcript Data Storage

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index pour recherche rapide par project
CREATE INDEX IF NOT EXISTS idx_transcripts_project_id
ON transcripts(project_id);

-- Transcript words table
CREATE TABLE IF NOT EXISTS transcript_words (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    confidence REAL NOT NULL,
    word_index INTEGER NOT NULL,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

-- Index composite pour récupération ordonnée
CREATE INDEX IF NOT EXISTS idx_transcript_words_transcript_id_index
ON transcript_words(transcript_id, word_index);
