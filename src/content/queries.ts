/**
 * What /wazne-telefony selects out of the contact points.
 *
 * The three blocks and their queries are fixed by design/screens/wazne-telefony.md. They
 * live here rather than in the page because the same filter has to run twice: once on the
 * server for a form submitted without JavaScript, and once in the browser if the filter is
 * ever enhanced. Two implementations would drift, and the spec forbids the enhanced path
 * from showing anything different for the same query.
 */
import type { ContactPoint, Facility, FacilityId } from './contact-point';
import { facilities, facilityOrder } from './facilities';
import { formatPhoneNumber } from './phone';
import { text } from './locale';

/**
 * The route is a shortlist, not the directory. A page that grows to hold every number
 * becomes the page it replaced.
 */
export const SHORTLIST_LIMIT = 8;

export interface FacilityGroup {
  readonly facility: Facility;
  /** At most SHORTLIST_LIMIT rows. */
  readonly contactPoints: readonly ContactPoint[];
  /** How many the facility has in total, before the shortlist cap. */
  readonly total: number;
  /** True when the group is capped and needs its "everything else" link. */
  readonly hasMore: boolean;
}

export type SortKey = 'label' | 'order';

export interface ContactFilter {
  /** Free text: label, unit, facility, note or any part of a number. */
  readonly q?: string;
  readonly facility?: FacilityId;
  readonly sort?: SortKey;
}

const collator = new Intl.Collator('pl', { sensitivity: 'base' });

/**
 * Comparison form: lower case, no diacritics. Someone typing "zaklady" on a keyboard
 * without Polish letters must still find "Zakłady diagnostyki obrazowej"; making them type
 * the diacritics correctly is a barrier we would be adding ourselves.
 */
export function searchable(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      // Not a combining mark, so NFD leaves it alone.
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
  );
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/** Everything about a record a free-text query may match. */
function haystack(contactPoint: ContactPoint): string {
  const parts = [
    text(contactPoint.label),
    text(contactPoint.facility.name),
    contactPoint.unit ? text(contactPoint.unit.name) : '',
    contactPoint.note ? text(contactPoint.note) : '',
    ...contactPoint.phones.map((phone) => (phone.label ? text(phone.label) : '')),
  ];
  return searchable(parts.join(' '));
}

/** Both the stored and the displayed form, so "764 01" and "58764" both match. */
function numberHaystack(contactPoint: ContactPoint): string {
  return contactPoint.phones
    .map((phone) => `${digitsOf(phone.number)} ${digitsOf(formatPhoneNumber(phone.number))}`)
    .join(' ');
}

export function matchesFilter(contactPoint: ContactPoint, filter: ContactFilter): boolean {
  if (filter.facility !== undefined && contactPoint.facility.id !== filter.facility) return false;

  const query = filter.q?.trim();
  if (query === undefined || query === '') return true;

  const digits = digitsOf(query);
  if (digits.length >= 2 && numberHaystack(contactPoint).includes(digits)) return true;

  return haystack(contactPoint).includes(searchable(query));
}

export function sortContactPoints(
  contactPoints: readonly ContactPoint[],
  sort: SortKey = 'order',
): readonly ContactPoint[] {
  const sorted = [...contactPoints];
  if (sort === 'label') {
    sorted.sort((a, b) => collator.compare(text(a.label), text(b.label)));
  } else {
    sorted.sort((a, b) => a.order - b.order);
  }
  return sorted;
}

/**
 * The Pilne block: what someone in a hurry needs, above everything else. Never filtered,
 * because a query that matches nothing must not take the emergency numbers off the page.
 */
export function urgentContactPoints(
  contactPoints: readonly ContactPoint[],
): readonly ContactPoint[] {
  return sortContactPoints(
    contactPoints.filter(
      (record) =>
        (record.category === 'emergency' || record.category === 'out-of-hours') &&
        record.audience.includes('patient'),
    ),
  );
}

/**
 * One group per facility, in the order facilities.ts fixes, including facilities with no
 * rows of their own: the group still carries the switchboard, which is the number a
 * visitor falls back to and which acceptance criterion 1 requires in the HTML.
 */
export function facilityGroups(
  contactPoints: readonly ContactPoint[],
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

  const facilityIds =
    filter.facility === undefined
      ? facilityOrder
      : facilityOrder.filter((id) => id === filter.facility);

  const groups = facilityIds.map((id) => {
    const rows = sortContactPoints(
      selected.filter((record) => record.facility.id === id),
      filter.sort,
    );
    return {
      facility: facilities[id],
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

/** Press, media and institutional contacts, kept apart from patient contacts. */
export function institutionalContactPoints(
  contactPoints: readonly ContactPoint[],
  filter: ContactFilter = {},
): readonly ContactPoint[] {
  return sortContactPoints(
    contactPoints.filter(
      (record) =>
        (record.audience.includes('media') || record.audience.includes('institution')) &&
        matchesFilter(record, filter),
    ),
    filter.sort,
  );
}

/** True when a filter is doing anything at all. */
export function isFiltered(filter: ContactFilter): boolean {
  return (filter.q !== undefined && filter.q.trim() !== '') || filter.facility !== undefined;
}

/** How many rows the filter leaves, Pilne aside. Drives the empty state and role="status". */
export function resultCount(contactPoints: readonly ContactPoint[], filter: ContactFilter): number {
  const grouped = facilityGroups(contactPoints, filter).reduce(
    (sum, group) => sum + group.total,
    0,
  );
  return grouped + institutionalContactPoints(contactPoints, filter).length;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Reads the query string the form submits. Unknown values are dropped rather than
 * rejected: a hand-edited URL must still render the page, never an error.
 */
export function parseContactFilter(
  searchParams: Record<string, string | string[] | undefined> = {},
): ContactFilter {
  const filter: { q?: string; facility?: FacilityId; sort?: SortKey } = {};

  const q = firstValue(searchParams.q)?.trim();
  if (q !== undefined && q !== '') filter.q = q;

  const facility = firstValue(searchParams.placowka);
  if (facility !== undefined && (facilityOrder as readonly string[]).includes(facility)) {
    filter.facility = facility as FacilityId;
  }

  if (firstValue(searchParams.sort) === 'label') filter.sort = 'label';

  return filter;
}

/** Rebuilds the query string, so a sort link keeps the filter the visitor already set. */
export function contactFilterHref(filter: ContactFilter, overrides: Partial<ContactFilter> = {}) {
  const merged = { ...filter, ...overrides };
  const params = new URLSearchParams();
  if (merged.q !== undefined && merged.q !== '') params.set('q', merged.q);
  if (merged.facility !== undefined) params.set('placowka', merged.facility);
  if (merged.sort === 'label') params.set('sort', 'label');
  const query = params.toString();
  return query === '' ? '/wazne-telefony' : `/wazne-telefony?${query}`;
}
