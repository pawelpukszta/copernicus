import { describe, expect, it } from 'vitest';
import { formatAvailability, formatDays, isAvailabilityUnknown } from './availability';

describe('formatDays', () => {
  it('collapses a working week into one span', () => {
    expect(formatDays([1, 2, 3, 4, 5])).toMatch(/^pon\.?.*–.*pt\.?$/);
  });

  it('lists two days instead of ranging them', () => {
    const formatted = formatDays([6, 7]);
    expect(formatted).toContain(',');
    expect(formatted).not.toContain('–');
  });

  it('keeps separate runs separate', () => {
    // Monday to Wednesday, then Friday.
    const formatted = formatDays([1, 2, 3, 5]);
    expect(formatted).toContain('–');
    expect(formatted).toContain(',');
  });

  it('names days in the requested locale', () => {
    expect(formatDays([1], 'en')).not.toBe(formatDays([1], 'pl'));
  });
});

describe('formatAvailability', () => {
  it('reads out weekly hours', () => {
    const line = formatAvailability({
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    });
    expect(line).toContain('07:00–15:00');
  });

  it('appends an exception with its note', () => {
    const line = formatAvailability({
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 5], from: '07:30', to: '18:00' }],
      exceptions: [{ days: [4], from: '07:30', to: '19:00', note: { pl: 'dłużej w czwartki' } }],
    });
    expect(line).toContain('07:30–19:00');
    expect(line).toContain('dłużej w czwartki');
  });

  it('says so out loud when the hours are unknown, and never returns a blank', () => {
    expect(formatAvailability({ kind: 'unknown' })).toBe('Godziny do potwierdzenia');
    expect(isAvailabilityUnknown({ kind: 'unknown' })).toBe(true);
  });

  it('has a word for round-the-clock cover', () => {
    expect(formatAvailability({ kind: '24/7' })).toBe('Całodobowo');
    expect(isAvailabilityUnknown({ kind: '24/7' })).toBe(false);
  });
});
