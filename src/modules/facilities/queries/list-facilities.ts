import type { Facility } from '../model/facility';
import { facilityRepository } from '../data/repository';

/** Every facility, in the order the site lists them: the hospitals first. */
export function listFacilities(): Promise<readonly Facility[]> {
  return facilityRepository.list();
}
