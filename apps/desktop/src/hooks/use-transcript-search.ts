import { useState, useEffect, useMemo } from 'react';
import type { TranscriptWord } from '@splice/types';

export function useTranscriptSearch(words: TranscriptWord[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Debounce search query (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Find matches
  const matches = useMemo(() => {
    if (!debouncedQuery) {
      return [];
    }

    const matchIndices = words
      .map((w, i) =>
        w.text.toLowerCase().includes(debouncedQuery.toLowerCase()) ? i : -1
      )
      .filter((i) => i !== -1);

    return matchIndices;
  }, [debouncedQuery, words]);

  // Reset current match when matches change
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0);
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [matches, currentMatchIndex]);

  const nextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const prevMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  return {
    searchQuery,
    setSearchQuery,
    matches,
    currentMatchIndex,
    setCurrentMatchIndex,
    nextMatch,
    prevMatch,
  };
}
