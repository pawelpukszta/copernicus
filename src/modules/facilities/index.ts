// model
export type { Facility, FacilityId, FacilityRef } from './model/facility';
export { facilityIds, isFacilityId, toFacilityRef } from './model/facility';

// queries
export { getFacility } from './queries/get-facility';
export { listFacilities } from './queries/list-facilities';
