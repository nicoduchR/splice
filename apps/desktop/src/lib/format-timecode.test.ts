import { describe, it, expect } from 'vitest';
import { formatTimecode } from './format-timecode';

describe('formatTimecode', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTimecode(0)).toBe('00:00');
  });

  it('should format seconds under a minute', () => {
    expect(formatTimecode(5)).toBe('00:05');
    expect(formatTimecode(59)).toBe('00:59');
  });

  it('should format minutes and seconds', () => {
    expect(formatTimecode(60)).toBe('01:00');
    expect(formatTimecode(125)).toBe('02:05');
    expect(formatTimecode(3599)).toBe('59:59');
  });

  it('should format hours for videos over 60 minutes', () => {
    expect(formatTimecode(3600)).toBe('01:00:00');
    expect(formatTimecode(5400)).toBe('01:30:00');
    expect(formatTimecode(7261)).toBe('02:01:01');
  });

  it('should floor fractional seconds', () => {
    expect(formatTimecode(1.7)).toBe('00:01');
    expect(formatTimecode(59.9)).toBe('00:59');
  });

  it('should return 00:00 for negative values', () => {
    expect(formatTimecode(-1)).toBe('00:00');
    expect(formatTimecode(-100)).toBe('00:00');
  });

  it('should return 00:00 for NaN and Infinity', () => {
    expect(formatTimecode(NaN)).toBe('00:00');
    expect(formatTimecode(Infinity)).toBe('00:00');
    expect(formatTimecode(-Infinity)).toBe('00:00');
  });
});
