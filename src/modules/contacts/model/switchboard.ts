/**
 * The switchboard: the number a facility answers on, and when.
 *
 * It is what a contact point falls back to when its own number is unknown, so it has to be
 * reachable from any record and it has to be one value, not a copy per row that drifts.
 * It is a contact rather than a property of the facility, because the noun decides where a
 * thing lives (docs/adr/0009-project-structure.md): a number and its hours belong to
 * contacts, the place belongs to facilities, and this record joins them through a
 * FacilityRef.
 */
import type { FacilityId, FacilityRef } from '@/modules/facilities';
import type { Availability } from './availability';
import type { Phone } from './contact-point';

export interface Switchboard {
  readonly facility: FacilityRef;
  readonly phone: Phone;
  /** When the switchboard is answered, which is what a fallback row shows. */
  readonly availability: Availability;
}

/**
 * The switchboard of one facility.
 *
 * @throws Error when there is none. Every facility has one, and the repository refuses to
 * load a set where that is not true, so reaching this is a data error.
 */
export function switchboardOf(
  switchboards: readonly Switchboard[],
  facilityId: FacilityId,
): Switchboard {
  const switchboard = switchboards.find((candidate) => candidate.facility.id === facilityId);
  if (switchboard === undefined) throw new Error(`No switchboard for facility ${facilityId}.`);
  return switchboard;
}
