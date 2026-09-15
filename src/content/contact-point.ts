/**
 * The contact point: one record, several views.
 *
 * /wazne-telefony, /kontakt and /szpitale/[slug] render these same records for different
 * jobs, so no field may be added for the benefit of one route. The closed model is in
 * design/screens/wazne-telefony.md; the reason it is a contact point rather than a phone
 * number is in design/information-architecture.md.
 *
 * Until a CMS is chosen this module is the contract that the CMS will have to satisfy.
 */
import type { LocalizedText } from './locale';
import type { EmergencyShortCode } from './phone';

export type FacilityId = 'kopernik' | 'sw-wojciech' | 'wco' | 'stomatologia' | 'profilaktyka';

/**
 * A reference as a CMS would expand it: enough to group by, to label a group and to link
 * to /szpitale/[slug] without a second query. The facility record itself, with its address
 * and switchboard, lives in facilities.ts.
 */
export interface FacilityRef {
  readonly id: FacilityId;
  readonly slug: string;
  readonly name: LocalizedText;
}

/**
 * The facility record, as far as this route needs it. The full entity (departments,
 * clinics, accessibility notes, photos) belongs to /szpitale/[slug] and is added there.
 */
export interface Facility extends FacilityRef {
  readonly address: LocalizedText;
  /** The number a row falls back to when its own is unknown. */
  readonly switchboard: Phone;
  readonly switchboardAvailability: Availability;
}

/** A department, clinic or building inside a facility. */
export interface UnitRef {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface Phone {
  /** E.164, for example "+48587640116". The display format is derived, never authored. */
  readonly number: string;
  /** Digits only. */
  readonly extension?: string;
  /** Set when a contact point has several numbers, e.g. "odwolania zabiegow". */
  readonly label?: LocalizedText;
  /** At most 60 characters. */
  readonly note?: LocalizedText;
}

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DayRange {
  readonly days: readonly Weekday[];
  /** "07:00", 24-hour clock. */
  readonly from: string;
  readonly to: string;
}

export interface AvailabilityException extends DayRange {
  readonly note?: LocalizedText;
}

/**
 * `unknown` is allowed but is never a silent blank: it renders as "Godziny do
 * potwierdzenia" and raises an authoring warning that reaches the content-gap report.
 */
export type Availability =
  | { readonly kind: '24/7' }
  | {
      readonly kind: 'hours';
      readonly weekly: readonly DayRange[];
      readonly exceptions?: readonly AvailabilityException[];
    }
  | { readonly kind: 'unknown' };

export const contactCategories = [
  'emergency',
  'out-of-hours',
  'registration',
  'diagnostics',
  'secretariat',
  'administration',
  'press',
  'institutional',
] as const;

export type ContactCategory = (typeof contactCategories)[number];

export const contactAudiences = ['patient', 'institution', 'media'] as const;

export type ContactAudience = (typeof contactAudiences)[number];

export interface ContactPoint {
  /** Stable CMS id, never derived from the number: many units share one number. */
  readonly id: string;
  /** Unique within the facility. */
  readonly slug: string;
  /** 3-80 characters, sentence case. Shouting capitals are rejected at authoring. */
  readonly label: LocalizedText;
  readonly facility: FacilityRef;
  readonly unit?: UnitRef;
  /** 0-4 numbers. At least one phone or an email is required. */
  readonly phones: readonly Phone[];
  /** E.164. A separate field precisely so no view can render it as something to call. */
  readonly fax?: string;
  /** A role mailbox, never a named person's address. */
  readonly email?: string;
  readonly availability: Availability;
  readonly category: ContactCategory;
  /** At least one. */
  readonly audience: readonly ContactAudience[];
  /** Within its group. */
  readonly order: number;
  /** ISO date, YYYY-MM-DD. */
  readonly lastReviewedAt: string;
  /** At most 140 characters, e.g. "budynek A, badania TK i MRI". */
  readonly note?: LocalizedText;
}

/**
 * The state emergency number is not a contact point: it belongs to no facility, it is not
 * E.164, and it is the one number on the page that is always correct. Keeping it out of
 * ContactPoint is what lets `Phone.number` stay strictly E.164 and `facility` stay
 * required, instead of both fields being loosened for a single record.
 */
export interface EmergencyContact {
  readonly code: EmergencyShortCode;
  readonly label: LocalizedText;
  readonly note?: LocalizedText;
}

/** Maximum numbers on one contact point, per the content model. */
export const MAX_PHONES_PER_CONTACT_POINT = 4;

export const MAX_LABEL_LENGTH = 80;
export const MIN_LABEL_LENGTH = 3;
export const MAX_NOTE_LENGTH = 140;
export const MAX_PHONE_NOTE_LENGTH = 60;
