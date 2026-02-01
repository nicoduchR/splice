import type { TranscriptWord } from '@splice/types/generated';

/**
 * Format un timestamp en secondes vers le format MM:SS.mmm
 * @param seconds - Timestamp en secondes (peut contenir des décimales)
 * @returns String formaté au format MM:SS.mmm (ex: "01:23.456")
 */
export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

/**
 * Détecte les débuts de paragraphes basés sur les pauses/silences entre mots
 * @param words - Liste des mots du transcript
 * @returns Array d'indices marquant le début de chaque paragraphe
 */
export function detectParagraphs(words: TranscriptWord[]): number[] {
  const PAUSE_THRESHOLD = 1.5; // 1.5 secondes de silence = nouveau paragraphe
  const paragraphStarts: number[] = [0]; // Premier mot toujours début paragraphe

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start_time - words[i - 1].end_time;
    if (gap > PAUSE_THRESHOLD) {
      paragraphStarts.push(i);
    }
  }

  return paragraphStarts;
}
