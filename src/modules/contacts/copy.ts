/**
 * Copy that the contacts module owns, because it describes the state of a record rather
 * than the design of a page: what a row says when its hours are unknown, and what it says
 * when the number shown is the switchboard standing in for one that does not exist yet.
 *
 * Locale-keyed from the start, like every human-readable string in a module, even while
 * Polish is the only locale written. See docs/adr/0008-internationalisation.md.
 */
import type { LocalizedText } from '@/shared/i18n';

export const contactCopy = {
  /** Availability of kind "unknown". Never a blank cell. */
  hoursUnknown: { pl: 'Godziny do potwierdzenia' },

  /** Availability of kind "24/7". */
  aroundTheClock: { pl: 'Całodobowo' },

  /**
   * The two halves of the fallback sentence, e.g.
   * "Rejestracja do poradni: numer w przygotowaniu, tymczasowo centrala 58 764 01 00".
   * Split so the number stays a separate link with its own 44 px target, rather than being
   * interpolated into a sentence a screen reader then reads as prose.
   */
  numberInPreparation: { pl: 'numer w przygotowaniu' },
  temporarilySwitchboard: { pl: 'tymczasowo centrala' },

  /** Marks a fax so it is never mistaken for something to call. */
  faxLabel: { pl: 'faks' },

  /** Extension, spoken as it is written on the number. */
  extensionLabel: { pl: 'wew.' },
} as const satisfies Record<string, LocalizedText>;
