import { describe, expect, it } from 'vitest';
import { getFacility, toFacilityRef } from '@/modules/facilities';
import type { ContactPoint } from '../model/contact-point';
import {
  contactFilterHref,
  isFiltered,
  matchesFilter,
  parseContactFilter,
  searchable,
  sortContactPoints,
} from './contact-filter';

const kopernik = toFacilityRef(await getFacility('kopernik'));

function contactPoint(overrides: Partial<ContactPoint> = {}): ContactPoint {
  return {
    id: 'kopernik-rejestracja',
    slug: 'rejestracja',
    label: { pl: 'Rejestracja przychodni' },
    facility: kopernik,
    phones: [{ number: '+48587723950' }],
    availability: { kind: 'unknown' },
    category: 'registration',
    audience: ['patient'],
    order: 1,
    lastReviewedAt: '2026-09-08',
    ...overrides,
  };
}

describe('sorting', () => {
  it('sorts by the authored order by default and by label on request', () => {
    const records = [
      contactPoint({ id: 'b', slug: 'b', label: { pl: 'Żywienie' }, order: 1 }),
      contactPoint({ id: 'a', slug: 'a', label: { pl: 'Alergologia' }, order: 2 }),
    ];

    expect(sortContactPoints(records).map((r) => r.id)).toEqual(['b', 'a']);
    expect(sortContactPoints(records, 'label').map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('the filter', () => {
  it('matches a label', () => {
    expect(matchesFilter(contactPoint(), { q: 'rejestracja' })).toBe(true);
    expect(matchesFilter(contactPoint(), { q: 'onkologia' })).toBe(false);
  });

  it('matches without the diacritics a visitor may not be able to type', () => {
    const record = contactPoint({ label: { pl: 'Zakłady diagnostyki obrazowej' } });
    expect(matchesFilter(record, { q: 'zaklady' })).toBe(true);
    expect(matchesFilter(record, { q: 'ZAKŁADY' })).toBe(true);
  });

  it('matches a number as it is displayed, not only as it is stored', () => {
    const record = contactPoint({ phones: [{ number: '+48587640116' }] });
    expect(matchesFilter(record, { q: '764 01' })).toBe(true);
    expect(matchesFilter(record, { q: '58764' })).toBe(true);
    expect(matchesFilter(record, { q: '999 99' })).toBe(false);
  });

  it('matches the facility a row belongs to', () => {
    expect(matchesFilter(contactPoint(), { q: 'Kopernika' })).toBe(true);
    expect(matchesFilter(contactPoint(), { facility: 'kopernik' })).toBe(true);
    expect(matchesFilter(contactPoint(), { facility: 'wco' })).toBe(false);
  });

  it('knows whether it is doing anything', () => {
    expect(isFiltered({})).toBe(false);
    expect(isFiltered({ q: '  ' })).toBe(false);
    expect(isFiltered({ q: 'sor' })).toBe(true);
    expect(isFiltered({ facility: 'wco' })).toBe(true);
  });
});

describe('the query string', () => {
  it('reads the form the page submits', () => {
    expect(parseContactFilter({ q: 'sor', placowka: 'wco', sort: 'label' })).toEqual({
      q: 'sor',
      facility: 'wco',
      sort: 'label',
    });
  });

  it('renders a hand-edited URL instead of failing on it', () => {
    expect(parseContactFilter({ placowka: 'nie-ma-takiej', sort: 'cokolwiek' })).toEqual({});
    expect(parseContactFilter({ q: '   ' })).toEqual({});
    expect(parseContactFilter()).toEqual({});
  });

  it('keeps the filter when a sort link is followed', () => {
    const filter = parseContactFilter({ q: 'sor', placowka: 'kopernik' });
    expect(contactFilterHref(filter, { sort: 'label' })).toBe(
      '/wazne-telefony?q=sor&placowka=kopernik&sort=label',
    );
  });

  it('drops back to the bare route when nothing is set', () => {
    expect(contactFilterHref({})).toBe('/wazne-telefony');
  });
});

describe('searchable', () => {
  it('folds case and Polish diacritics, including the ones NFD leaves alone', () => {
    expect(searchable('Żółć')).toBe('zolc');
    expect(searchable('Wałowa')).toBe('walowa');
    expect(searchable('ŁÓDŹ')).toBe('lodz');
  });
});
