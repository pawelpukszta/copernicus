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
import type { FacilityRef } from '@/modules/facilities';
import type { LocalizedText } from '@/shared/i18n';
import type { Availability } from './availability';

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

/** Maximum numbers on one contact point, per the content model. */
export const MAX_PHONES_PER_CONTACT_POINT = 4;

export const MAX_LABEL_LENGTH = 80;
export const MIN_LABEL_LENGTH = 3;
export const MAX_NOTE_LENGTH = 140;
export const MAX_PHONE_NOTE_LENGTH = 60;
