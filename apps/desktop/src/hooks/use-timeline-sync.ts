import { useEffect } from 'react';
import { useTranscriptStore } from '../stores/transcript-store';
import { useTimelineStore } from '../stores/timeline-store';

export function useTimelineSync() {
  const selections = useTranscriptStore((s) => s.selections);
  const transcript = useTranscriptStore((s) => s.transcript);
  const setSegments = useTimelineStore((s) => s.setSegments);
  const setDuration = useTimelineStore((s) => s.setDuration);

  useEffect(() => {
    if (!transcript?.words?.length) {
      setSegments([]);
      setDuration(0);
      return;
    }

    const lastWord = transcript.words[transcript.words.length - 1];
    setDuration(lastWord.end_time);

    const segments = selections.map((sel) => ({
      id: sel.id,
      startTime: sel.startTime,
      endTime: sel.endTime,
      selected: true,
    }));

    setSegments(segments);
  }, [selections, transcript, setSegments, setDuration]);
}
