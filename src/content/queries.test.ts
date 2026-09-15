import { describe, expect, it } from 'vitest';
import { contactPoints } from './contact-points';
import { facilityOrder } from './facilities';
import {
  SHORTLIST_LIMIT,
  contactFilterHref,
  facilityGroups,
  institutionalContactPoints,
  isFiltered,
  matchesFilter,
  parseContactFilter,
  resultCount,
  searchable,
  sortContactPoints,
  urgentContactPoints,
} from './queries';
import type { ContactPoint } from './contact-point';
import { facilityRef } from './facilities';

function contactPoint(overrides: Partial<ContactPoint> = {}): ContactPoint {
  return {
    id: 'kopernik-rejestracja',
    slug: 'rejestracja',
    label: { pl: 'Rejestracja przychodni' },
    facility: facilityRef('kopernik'),
    phones: [{ number: '+48587723950' }],
    availability: { kind: 'unknown' },
    category: 'registration',
    audience: ['patient'],
    order: 1,
    lastReviewedAt: '2026-09-08',
    ...overrides,
  };
}

describe('the Pilne block', () => {
  it('holds the emergency and out-of-hours numbers a patient needs, in order', () => {
    expect(urgentContactPoints(contactPoints).map((record) => record.id)).toEqual([
      'kopernik-sor',
      'noc-swiateczna',
    ]);
  });

  it('carries nothing administrative', () => {
    for (const record of urgentContactPoints(contactPoints)) {
      expect(['emergency', 'out-of-hours']).toContain(record.category);
    }
  });
});

describe('the facility groups', () => {
  it('render every facility, so all five switchboards reach the page', () => {
    expect(facilityGroups(contactPoints).map((group) => group.facility.id)).toEqual([
      ...facilityOrder,
    ]);
  });

  it('carry patient registration and diagnostics, not press or institutional rows', () => {
    const ids = facilityGroups(contactPoints).flatMap((group) =>
      group.contactPoints.map((record) => record.id),
    );
    expect(ids).toContain('kopernik-rejestracja-przychodni');
    expect(ids).not.toContain('rzecznik-prasowy');
    expect(ids).not.toContain('kopernik-sekretariat-zarzadu');
  });

  it('stay a shortlist', () => {
    const crowd = Array.from({ length: SHORTLIST_LIMIT + 3 }, (_, index) =>
      contactPoint({ id: `row-${index}`, slug: `row-${index}`, order: index }),
    );
    const group = facilityGroups(crowd)[0];

    expect(group?.contactPoints).toHaveLength(SHORTLIST_LIMIT);
    expect(group?.total).toBe(SHORTLIST_LIMIT + 3);
    expect(group?.hasMore).toBe(true);
  });

  it('sorts by the authored order by default and by label on request', () => {
    const records = [
      contactPoint({ id: 'b', slug: 'b', label: { pl: 'Żywienie' }, order: 1 }),
      contactPoint({ id: 'a', slug: 'a', label: { pl: 'Alergologia' }, order: 2 }),
    ];

    expect(sortContactPoints(records).map((r) => r.id)).toEqual(['b', 'a']);
    expect(sortContactPoints(records, 'label').map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('the institutional block', () => {
  it('keeps press and institutional contacts out of the patient groups', () => {
    const ids = institutionalContactPoints(contactPoints).map((record) => record.id);
    expect(ids).toContain('rzecznik-prasowy');
    expect(ids).toContain('zespol-kontroli-zakazen');
    expect(ids).toContain('kopernik-sekretariat-zarzadu');
    expect(ids).not.toContain('kopernik-sor');
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

  it('drops facilities that matched nothing, but only while a filter is on', () => {
    const unfiltered = facilityGroups(contactPoints);
    expect(unfiltered.map((group) => group.facility.id)).toEqual([...facilityOrder]);

    const filtered = facilityGroups(contactPoints, { q: 'diagnostyki' });
    expect(filtered.length).toBeGreaterThan(0);
    for (const group of filtered) {
      expect(group.total).toBeGreaterThan(0);
    }
  });

  it('narrows the groups to one facility', () => {
    const groups = facilityGroups(contactPoints, { facility: 'wco' });
    expect(groups.map((group) => group.facility.id)).toEqual(['wco']);
  });

  it('can leave nothing, which is what the empty state is for', () => {
    const filter = { q: 'kardiologia dziecięca' };
    expect(resultCount(contactPoints, filter)).toBe(0);
    // Pilne is selected without the filter, so it survives.
    expect(urgentContactPoints(contactPoints).length).toBeGreaterThan(0);
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
