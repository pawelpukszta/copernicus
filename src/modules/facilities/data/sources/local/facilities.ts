/**
 * The five facilities, in the order the site lists them: the hospitals first, then the
 * outpatient centres.
 *
 * Addresses come from design/information-architecture.md. The number each facility answers
 * on is a contact, not a property of the place, and lives in
 * modules/contacts/data/sources/local/switchboards.ts.
 */
import type { Facility } from '../../../model/facility';
import type { FacilityRepository } from '../../repository';

const facilityList: readonly Facility[] = [
  {
    id: 'kopernik',
    slug: 'szpital-kopernika',
    name: { pl: 'Szpital im. M. Kopernika' },
    address: { pl: 'ul. Nowe Ogrody 1-6, 80-803 Gdańsk' },
  },
  {
    id: 'sw-wojciech',
    slug: 'szpital-sw-wojciecha',
    name: { pl: 'Szpital św. Wojciecha' },
    address: { pl: 'al. Jana Pawła II 50, 80-462 Gdańsk' },
  },
  {
    id: 'wco',
    slug: 'wojewodzkie-centrum-onkologii',
    name: { pl: 'Wojewódzkie Centrum Onkologii' },
    address: { pl: 'ul. Skłodowskiej-Curie 2, 80-210 Gdańsk' },
  },
  {
    id: 'stomatologia',
    slug: 'copernicus-stomatologia',
    name: { pl: 'COPERNICUS Stomatologia' },
    address: { pl: 'al. Zwycięstwa 39, Gdańsk' },
  },
  {
    id: 'profilaktyka',
    slug: 'copernicus-profilaktyka',
    name: { pl: 'COPERNICUS Profilaktyka' },
    address: { pl: 'ul. Wałowa 27, Gdańsk' },
  },
];

export const localFacilityRepository: FacilityRepository = {
  list: () => Promise.resolve(facilityList),
};
