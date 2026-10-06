import { describe, expect, it } from 'vitest';
import { getFacility, toFacilityRef } from '@/modules/facilities';
import { contactRepository } from '../data/repository';
import type { ContactPoint } from '../model/contact-point';
import { SHORTLIST_LIMIT, facilityGroups, resultCount } from './facility-groups';
import { listFacilitySwitchboards } from './list-facility-switchboards';
import { urgentContactPoints } from './urgent-contact-points';

const contactPoints = await contactRepository.contactPoints();
const directory = await listFacilitySwitchboards();
const facilityOrder = directory.map((entry) => entry.facility.id);
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

describe('the facility groups', () => {
  it('render every facility, so all five switchboards reach the page', () => {
    const groups = facilityGroups(contactPoints, directory);
    expect(groups.map((group) => group.facility.id)).toEqual(facilityOrder);
    expect(groups.map((group) => group.switchboard.facility.id)).toEqual(facilityOrder);
  });

  it('carry patient registration and diagnostics, not press or institutional rows', () => {
    const ids = facilityGroups(contactPoints, directory).flatMap((group) =>
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
    const group = facilityGroups(crowd, directory)[0];

    expect(group?.contactPoints).toHaveLength(SHORTLIST_LIMIT);
    expect(group?.total).toBe(SHORTLIST_LIMIT + 3);
    expect(group?.hasMore).toBe(true);
  });
});

describe('the groups under a filter', () => {
  it('drop facilities that matched nothing, but only while a filter is on', () => {
    const unfiltered = facilityGroups(contactPoints, directory);
    expect(unfiltered.map((group) => group.facility.id)).toEqual(facilityOrder);

    const filtered = facilityGroups(contactPoints, directory, { q: 'diagnostyki' });
    expect(filtered.length).toBeGreaterThan(0);
    for (const group of filtered) {
      expect(group.total).toBeGreaterThan(0);
    }
  });

  it('narrow to one facility', () => {
    const groups = facilityGroups(contactPoints, directory, { facility: 'wco' });
    expect(groups.map((group) => group.facility.id)).toEqual(['wco']);
  });

  it('can leave nothing, which is what the empty state is for', () => {
    const filter = { q: 'kardiologia dziecięca' };
    expect(resultCount(contactPoints, directory, filter)).toBe(0);
    // Pilne is selected without the filter, so it survives.
    expect(urgentContactPoints(contactPoints).length).toBeGreaterThan(0);
  });
});
