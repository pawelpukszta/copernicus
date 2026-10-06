/**
 * Everything /wazne-telefony renders, read once and shaped here, so the page only lays it
 * out. The three blocks are fixed by design/screens/wazne-telefony.md.
 *
 * Every row arrives with its phones already resolved, so no view can forget the
 * switchboard fallback or render it unlabelled.
 */
import type { Facility } from '@/modules/facilities';
import { contactRepository } from '../data/repository';
import type { ContactPoint } from '../model/contact-point';
import type { Switchboard } from '../model/switchboard';
import type { ContactFilter } from './contact-filter';
import { isFiltered, parseContactFilter } from './contact-filter';
import { facilityGroups, resultCount } from './facility-groups';
import { institutionalContactPoints } from './institutional-contact-points';
import { listFacilitySwitchboards } from './list-facility-switchboards';
import type { ResolvedPhones } from './resolve-phones';
import { resolvePhones } from './resolve-phones';
import { urgentContactPoints } from './urgent-contact-points';

export interface ContactRow {
  readonly contactPoint: ContactPoint;
  readonly phones: ResolvedPhones;
}

export interface ImportantPhonesGroup {
  readonly facility: Facility;
  readonly switchboard: Switchboard;
  /** At most SHORTLIST_LIMIT rows. */
  readonly rows: readonly ContactRow[];
  readonly total: number;
  readonly hasMore: boolean;
}

export interface ImportantPhones {
  readonly filter: ContactFilter;
  readonly filtered: boolean;
  /** Rows the filter leaves, Pilne aside. */
  readonly found: number;
  /** The Pilne block, never filtered. 112 is a constant and is not in here. */
  readonly urgent: readonly ContactRow[];
  readonly groups: readonly ImportantPhonesGroup[];
  readonly institutional: readonly ContactRow[];
  /** Every facility, whatever the filter leaves, for the facility select. */
  readonly facilities: readonly Facility[];
}

export async function getImportantPhones(
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<ImportantPhones> {
  const filter = parseContactFilter(searchParams);
  const [contactPoints, directory] = await Promise.all([
    contactRepository.contactPoints(),
    listFacilitySwitchboards(),
  ]);
  const switchboards = directory.map((entry) => entry.switchboard);
  const toRow = (contactPoint: ContactPoint): ContactRow => ({
    contactPoint,
    phones: resolvePhones(contactPoint, switchboards),
  });

  return {
    filter,
    filtered: isFiltered(filter),
    found: resultCount(contactPoints, directory, filter),
    urgent: urgentContactPoints(contactPoints).map(toRow),
    groups: facilityGroups(contactPoints, directory, filter).map((group) => ({
      facility: group.facility,
      switchboard: group.switchboard,
      rows: group.contactPoints.map(toRow),
      total: group.total,
      hasMore: group.hasMore,
    })),
    institutional: institutionalContactPoints(contactPoints, filter).map(toRow),
    facilities: directory.map((entry) => entry.facility),
  };
}
