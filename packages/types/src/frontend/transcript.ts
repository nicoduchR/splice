// Frontend-specific types for transcript display and editing
// These extend/adapt the Rust-generated types for UI requirements

import type { Word } from '../generated';

/**
 * Frontend representation of a transcript word with additional UI properties
 * Adapts the backend Word type to include an index for virtualization
 */
export interface TranscriptWord {
  index: number; // Word position in transcript (for virtualization and selection)
  text: string;
  start_time: number; // Seconds with decimals
  end_time: number;   // Seconds with decimals
  confidence: number; // 0.0 to 1.0
}

/**
 * Frontend representation of a complete transcript
 * Stored in the database and loaded for display/editing
 */
export interface Transcript {
  id: string;
  project_id: string;
  full_text: string;
  language: string;
  created_at: number; // Unix timestamp
  words: TranscriptWord[];
}

/**
 * Convert backend Word to frontend TranscriptWord
 */
export function toTranscriptWord(word: Word, index: number): TranscriptWord {
  return {
    index,
    text: word.text,
    start_time: word.start,
    end_time: word.end,
    confidence: word.confidence,
  };
}
