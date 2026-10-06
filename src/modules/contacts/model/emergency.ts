/**
 * The state emergency numbers.
 *
 * They are short codes, not E.164, and belong to the state rather than to a facility. That
 * is why they are not contact points: keeping them out of ContactPoint is what lets
 * `Phone.number` stay strictly E.164 and `facility` stay required, instead of both fields
 * being loosened for a single record, and no authoring path can smuggle a three-digit
 * string into a facility record.
 */
import type { LocalizedText } from '@/shared/i18n';

export const emergencyShortCodes = ['112', '997', '998', '999'] as const;

export type EmergencyShortCode = (typeof emergencyShortCodes)[number];

export function isEmergencyShortCode(value: string): value is EmergencyShortCode {
  return (emergencyShortCodes as readonly string[]).includes(value);
}

/** Display form of an emergency short code. Short codes are read as written. */
export function formatEmergencyShortCode(code: EmergencyShortCode): string {
  return code;
}

/** The `tel:` target. A short code is dialled as written, with nothing to format. */
export function emergencyTelHref(code: EmergencyShortCode): string {
  return `tel:${code}`;
}

export interface EmergencyContact {
  readonly code: EmergencyShortCode;
  readonly label: LocalizedText;
  readonly note?: LocalizedText;
}

/**
 * 112 is the one number on the page that is always correct, which is why it is a constant
 * rather than a record an editor can retype. It heads the Pilne block and the permanent
 * header strip.
 */
export const emergencyNumber: EmergencyContact = {
  code: '112',
  label: { pl: 'Numer alarmowy' },
  note: { pl: 'Pogotowie ratunkowe, straż pożarna, policja' },
};
