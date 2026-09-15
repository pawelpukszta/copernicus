/**
 * Availability as one line of text.
 *
 * It is a cell of plain text, never a tooltip and never a blank: a visitor deciding
 * whether it is worth calling at 18:00 is exactly who this page is for, and the current
 * site records hours for one entry in fifteen.
 *
 * Day names come from Intl rather than a table in this file, so the three languages that
 * arrive later are already right and nothing here has to be translated by hand.
 */
import type { Availability, DayRange, Weekday } from './contact-point';
import { contactCopy } from './copy';
import type { Locale } from './locale';
import { defaultLocale, text } from './locale';

/** ISO weekday numbers: 1 is Monday. 2024-01-01 was a Monday, so it anchors the names. */
function weekdayName(day: Weekday, locale: Locale): string {
  const date = new Date(Date.UTC(2024, 0, day));
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}

/** Consecutive days collapse into a range: Monday to Friday reads as one span, not five. */
function groupConsecutive(days: readonly Weekday[]): Weekday[][] {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const runs: Weekday[][] = [];

  for (const day of sorted) {
    const current = runs[runs.length - 1];
    const last = current?.[current.length - 1];
    if (current !== undefined && last !== undefined && day === last + 1) current.push(day);
    else runs.push([day]);
  }

  return runs;
}

export function formatDays(days: readonly Weekday[], locale: Locale = defaultLocale): string {
  return groupConsecutive(days)
    .map((run) => {
      const first = run[0];
      const last = run[run.length - 1];
      if (first === undefined || last === undefined) return '';
      if (run.length === 1) return weekdayName(first, locale);
      // A two-day run reads better as a list than as a range.
      if (run.length === 2) return `${weekdayName(first, locale)}, ${weekdayName(last, locale)}`;
      return `${weekdayName(first, locale)}–${weekdayName(last, locale)}`;
    })
    .filter((part) => part !== '')
    .join(', ');
}

export function formatDayRange(range: DayRange, locale: Locale = defaultLocale): string {
  return `${formatDays(range.days, locale)} ${range.from}–${range.to}`;
}

/**
 * The whole availability as one line. `unknown` renders as "Godziny do potwierdzenia" in
 * muted text, which the caller styles; it is never an empty cell.
 */
export function formatAvailability(
  availability: Availability,
  locale: Locale = defaultLocale,
): string {
  switch (availability.kind) {
    case '24/7':
      return text(contactCopy.aroundTheClock, locale);
    case 'unknown':
      return text(contactCopy.hoursUnknown, locale);
    case 'hours': {
      const weekly = availability.weekly.map((range) => formatDayRange(range, locale));
      const exceptions = (availability.exceptions ?? []).map((exception) => {
        const line = formatDayRange(exception, locale);
        return exception.note === undefined ? line : `${line} (${text(exception.note, locale)})`;
      });
      return [...weekly, ...exceptions].join('; ');
    }
  }
}

/** True when the line is a placeholder for missing data, so the view can mute it. */
export function isAvailabilityUnknown(availability: Availability): boolean {
  return availability.kind === 'unknown';
}
