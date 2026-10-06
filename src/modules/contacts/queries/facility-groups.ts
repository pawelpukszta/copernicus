import type { Facility } from '@/modules/facilities';
import type { ContactPoint } from '../model/contact-point';
import type { Switchboard } from '../model/switchboard';
import type { ContactFilter } from './contact-filter';
import { isFiltered, matchesFilter, sortContactPoints } from './contact-filter';
import { institutionalContactPoints } from './institutional-contact-points';
import type { FacilitySwitchboard } from './list-facility-switchboards';

/**
 * The route is a shortlist, not the directory. A page that grows to hold every number
 * becomes the page it replaced.
 */
export const SHORTLIST_LIMIT = 8;

export interface FacilityGroup {
  readonly facility: Facility;
  /** Shown in the group header, and what a row without a number falls back to. */
  readonly switchboard: Switchboard;
  /** At most SHORTLIST_LIMIT rows. */
  readonly contactPoints: readonly ContactPoint[];
  /** How many the facility has in total, before the shortlist cap. */
  readonly total: number;
  /** True when the group is capped and needs its "everything else" link. */
  readonly hasMore: boolean;
}

/**
 * One group per facility, in the order the facilities are listed, including facilities
 * with no rows of their own: the group still carries the switchboard, which is the number
 * a visitor falls back to and which acceptance criterion 1 requires in the HTML.
 */
export function facilityGroups(
  contactPoints: readonly ContactPoint[],
  facilities: readonly FacilitySwitchboard[],
  filter: ContactFilter = {},
): readonly FacilityGroup[] {
  const selected = contactPoints.filter(
    (record) =>
      record.audience.includes('patient') &&
      (record.category === 'registration' ||
        record.category === 'diagnostics' ||
        record.category === 'secretariat') &&
      matchesFilter(record, filter),
  );

  const listed =
    filter.facility === undefined
      ? facilities
      : facilities.filter((entry) => entry.facility.id === filter.facility);

  const groups = listed.map(({ facility, switchboard }) => {
    const rows = sortContactPoints(
      selected.filter((record) => record.facility.id === facility.id),
      filter.sort,
    );
    return {
      facility,
      switchboard,
      contactPoints: rows.slice(0, SHORTLIST_LIMIT),
      total: rows.length,
      hasMore: rows.length > SHORTLIST_LIMIT,
    };
  });

  // Unfiltered, every facility appears even with no rows of its own, because its group
  // still carries the switchboard. Once a query is on, a facility that matched nothing is
  // noise: someone searching for "diagnostyka" is not asking for five switchboards.
  return isFiltered(filter) ? groups.filter((group) => group.total > 0) : groups;
}

/** How many rows the filter leaves, Pilne aside. Drives the empty state and role="status". */
export function resultCount(
  contactPoints: readonly ContactPoint[],
  facilities: readonly FacilitySwitchboard[],
  filter: ContactFilter,
): number {
  const grouped = facilityGroups(contactPoints, facilities, filter).reduce(
    (sum, group) => sum + group.total,
    0,
  );
  return grouped + institutionalContactPoints(contactPoints, filter).length;
}
