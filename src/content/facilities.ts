/**
 * The five facilities, with the switchboard each one answers on.
 *
 * The switchboard is on the facility rather than on a contact point because it is what a
 * row falls back to when its own number is unknown: the fallback must be reachable from
 * any record, and it must be one value, not a copy per row that drifts.
 *
 * Addresses come from design/information-architecture.md; numbers from
 * design/audit-current-site.md.
 */
import type { Facility, FacilityId, FacilityRef } from './contact-point';

const facilityList: readonly Facility[] = [
  {
    id: 'kopernik',
    slug: 'szpital-kopernika',
    name: { pl: 'Szpital im. M. Kopernika' },
    address: { pl: 'ul. Nowe Ogrody 1-6, 80-803 Gdańsk' },
    switchboard: { number: '+48587640100' },
    // The one entry on the current page that records its hours at all.
    switchboardAvailability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    },
  },
  {
    id: 'sw-wojciech',
    slug: 'szpital-sw-wojciecha',
    name: { pl: 'Szpital św. Wojciecha' },
    address: { pl: 'al. Jana Pawła II 50, 80-462 Gdańsk' },
    switchboard: { number: '+48587684000' },
    switchboardAvailability: { kind: 'unknown' },
  },
  {
    id: 'wco',
    slug: 'wojewodzkie-centrum-onkologii',
    name: { pl: 'Wojewódzkie Centrum Onkologii' },
    address: { pl: 'ul. Skłodowskiej-Curie 2, 80-210 Gdańsk' },
    // Deliberately not 58 341 93 48. That number is published as WCO's contact number on
    // the current site and is the director's secretariat *fax*; the phone is this one.
    // See design/audit-current-site.md, finding 7. The fax is held on the secretariat
    // record's `fax` field, where no view can dial it.
    switchboard: { number: '+48587324878' },
    // From /kontakt, where the secretariat is the only published way in. Whether WCO has a
    // switchboard of its own is a question for the content owner.
    switchboardAvailability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    },
  },
  {
    id: 'stomatologia',
    slug: 'copernicus-stomatologia',
    name: { pl: 'COPERNICUS Stomatologia' },
    address: { pl: 'al. Zwycięstwa 39, Gdańsk' },
    switchboard: { number: '+48585203837' },
    switchboardAvailability: { kind: 'unknown' },
  },
  {
    id: 'profilaktyka',
    slug: 'copernicus-profilaktyka',
    name: { pl: 'COPERNICUS Profilaktyka' },
    address: { pl: 'ul. Wałowa 27, Gdańsk' },
    switchboard: { number: '+48583005676', extension: '101' },
    switchboardAvailability: { kind: 'unknown' },
  },
];

export const facilities: Readonly<Record<FacilityId, Facility>> = Object.freeze(
  Object.fromEntries(facilityList.map((facility) => [facility.id, facility])) as Record<
    FacilityId,
    Facility
  >,
);

/** Facility order on the page: the hospitals first, then the outpatient centres. */
export const facilityOrder: readonly FacilityId[] = facilityList.map((facility) => facility.id);

export function getFacility(id: FacilityId): Facility {
  return facilities[id];
}

/**
 * The reference a contact point carries. Built from the facility record rather than typed
 * out per contact point, so the name and the slug have one source.
 */
export function facilityRef(id: FacilityId): FacilityRef {
  const { slug, name } = facilities[id];
  return { id, slug, name };
}
