/**
 * The /wazne-telefony filter: what the form submits, how it is read back, and what a query
 * matches.
 *
 * It lives in a query rather than in the page because the same filter has to run twice:
 * once on the server for a form submitted without JavaScript, and once in the browser if
 * the filter is ever enhanced. Two implementations would drift, and the spec forbids the
 * enhanced path from showing anything different for the same query.
 */
import type { FacilityId } from '@/modules/facilities';
import { isFacilityId } from '@/modules/facilities';
import { text } from '@/shared/i18n';
import { formatPhoneNumber } from '@/shared/lib/phone';
import type { ContactPoint } from '../model/contact-point';

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

/** True when a filter is doing anything at all. */
export function isFiltered(filter: ContactFilter): boolean {
  return (filter.q !== undefined && filter.q.trim() !== '') || filter.facility !== undefined;
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
  if (facility !== undefined && isFacilityId(facility)) filter.facility = facility;

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
