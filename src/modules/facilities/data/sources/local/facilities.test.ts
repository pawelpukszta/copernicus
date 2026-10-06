import { describe, expect, it } from 'vitest';
import { facilityIds } from '../../../model/facility';
import { getFacility } from '../../../queries/get-facility';
import { listFacilities } from '../../../queries/list-facilities';

const facilities = await listFacilities();

describe('the shipped facilities', () => {
  it('are the five the group runs, one record each', () => {
    expect(facilities.map((facility) => facility.id).sort()).toEqual([...facilityIds].sort());
  });

  it('list the hospitals first, then the outpatient centres', () => {
    expect(facilities.map((facility) => facility.id)).toEqual([
      'kopernik',
      'sw-wojciech',
      'wco',
      'stomatologia',
      'profilaktyka',
    ]);
  });

  it('have unique slugs, because /szpitale/[slug] routes on them', () => {
    const slugs = facilities.map((facility) => facility.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('are found by id', async () => {
    expect((await getFacility('wco')).name.pl).toBe('Wojewódzkie Centrum Onkologii');
  });
});
