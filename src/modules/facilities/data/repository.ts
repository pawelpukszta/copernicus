import type { Facility } from '../model/facility';
import { localFacilityRepository } from './sources/local/facilities';

export interface FacilityRepository {
  /** Every facility, in the order the site lists them. */
  list(): Promise<readonly Facility[]>;
}

// The active source. Switching to the CMS is this line plus the cms/ folder; nothing above
// data/ changes.
export const facilityRepository: FacilityRepository = localFacilityRepository;
