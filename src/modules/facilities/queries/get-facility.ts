import type { Facility, FacilityId } from '../model/facility';
import { facilityRepository } from '../data/repository';

/**
 * One facility by id.
 *
 * @throws Error when the source has no record for a known id. FacilityId is closed, so a
 * missing record is a data error that must fail the build, not render an empty page.
 */
export async function getFacility(id: FacilityId): Promise<Facility> {
  const facility = (await facilityRepository.list()).find((candidate) => candidate.id === id);
  if (facility === undefined) throw new Error(`No facility record for id ${id}.`);
  return facility;
}
