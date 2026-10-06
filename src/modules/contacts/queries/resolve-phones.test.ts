import { describe, expect, it } from 'vitest';
import { getFacility, toFacilityRef } from '@/modules/facilities';
import { contactRepository } from '../data/repository';
import type { ContactPoint } from '../model/contact-point';
import { isFallback, resolvePhones } from './resolve-phones';

const contactPoints = await contactRepository.contactPoints();
const switchboards = await contactRepository.switchboards();
const kopernik = toFacilityRef(await getFacility('kopernik'));
const wco = toFacilityRef(await getFacility('wco'));

function switchboardOf(id: string) {
  const switchboard = switchboards.find((candidate) => candidate.facility.id === id);
  if (switchboard === undefined) throw new Error(`No switchboard for ${id} in the fixtures.`);
  return switchboard;
}

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

describe('resolvePhones', () => {
  it("returns a unit's own numbers untouched", () => {
    const record = contactPoint();
    const resolved = resolvePhones(record, switchboards);
    expect(resolved.kind).toBe('own');
    expect(resolved.phones).toEqual(record.phones);
  });

  it('stands the facility switchboard in for a number that does not exist yet', () => {
    const resolved = resolvePhones(contactPoint({ phones: [] }), switchboards);
    expect(resolved).toMatchObject({
      kind: 'fallback',
      phones: [{ number: '+48587640100' }],
    });
  });

  it('marks the substitution, so no view can render it as the unit’s own number', () => {
    // The whole point of the decision: the patient is told they are being given the
    // switchboard. A silently swapped array would make that impossible to render.
    expect(isFallback(contactPoint({ phones: [] }), switchboards)).toBe(true);
    expect(isFallback(contactPoint(), switchboards)).toBe(false);
  });

  it("carries the switchboard's hours, not the unit's", () => {
    const resolved = resolvePhones(
      contactPoint({ phones: [], availability: { kind: 'unknown' } }),
      switchboards,
    );
    expect(resolved.kind === 'fallback' && resolved.availability).toEqual(
      switchboardOf('kopernik').availability,
    );
  });

  it('follows the facility of the record, not one default', () => {
    const resolved = resolvePhones(
      contactPoint({ facility: wco, phones: [], id: 'wco-infolinia' }),
      switchboards,
    );
    expect(resolved.kind === 'fallback' && resolved.facility.id).toBe('wco');
    expect(resolved.phones[0]?.number).toBe(switchboardOf('wco').phone.number);
  });

  it('fails loudly rather than render a row with nowhere to call', () => {
    expect(() => resolvePhones(contactPoint({ phones: [] }), [])).toThrow(/kopernik/);
  });
});

describe('the rows the current site leaves without a number', () => {
  it('reaches a human on every one of them', () => {
    const withoutNumber = contactPoints.filter((record) => record.phones.length === 0);
    expect(withoutNumber.length).toBeGreaterThan(0);

    for (const record of withoutNumber) {
      const resolved = resolvePhones(record, switchboards);
      expect(resolved.kind).toBe('fallback');
      expect(resolved.phones).toHaveLength(1);
    }
  });

  it('gives out-of-hours care the Kopernik switchboard until its own number exists', () => {
    // Today the site publishes a link labelled "TUTAJ" here and nothing else.
    const outOfHours = contactPoints.find((record) => record.id === 'noc-swiateczna');
    if (outOfHours === undefined) throw new Error('The out-of-hours record is missing.');
    expect(resolvePhones(outOfHours, switchboards).phones[0]?.number).toBe('+48587640100');
  });
});
