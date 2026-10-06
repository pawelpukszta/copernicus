/**
 * The facility: one of the five places the hospital group runs.
 *
 * Every other noun on the site belongs to a place, which is why this module is the root of
 * the module graph and imports no other module. What a facility can be reached on (its
 * switchboard and the hours it is answered) is a contact, and lives in modules/contacts
 * with a FacilityRef pointing back here.
 *
 * The full entity (departments, clinics, accessibility notes, photos) belongs to
 * /szpitale/[slug] and is added when that route is specified.
 */
import type { LocalizedText } from '@/shared/i18n';

/** Closed: a sixth facility is an organisational decision, not a record an editor adds. */
export const facilityIds = [
  'kopernik',
  'sw-wojciech',
  'wco',
  'stomatologia',
  'profilaktyka',
] as const;

export type FacilityId = (typeof facilityIds)[number];

export function isFacilityId(value: string): value is FacilityId {
  return (facilityIds as readonly string[]).includes(value);
}

/**
 * A reference as a CMS would expand it: enough to group by, to label a group and to link
 * to /szpitale/[slug] without a second query. Other modules store this, never a copy of
 * the facility's fields.
 */
export interface FacilityRef {
  readonly id: FacilityId;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface Facility extends FacilityRef {
  readonly address: LocalizedText;
}

/**
 * The reference another module stores. Built from the record rather than typed out per
 * referring record, so the name and the slug have one source.
 */
export function toFacilityRef(facility: Facility): FacilityRef {
  const { id, slug, name } = facility;
  return { id, slug, name };
}
