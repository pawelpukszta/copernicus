import type { FacilityId, FacilityRef } from '@/modules/facilities';
import { listFacilities, toFacilityRef } from '@/modules/facilities';
import type { ContactRepository } from '../../repository';
import { contactPointRecords } from './contact-points';
import { switchboardRecords } from './switchboards';

function refFor(refs: ReadonlyMap<FacilityId, FacilityRef>, id: FacilityId): FacilityRef {
  const ref = refs.get(id);
  if (ref === undefined) throw new Error(`No facility record for id ${id}.`);
  return ref;
}

/**
 * The typed records in this folder, with each facility id expanded into the reference the
 * model carries. A CMS would deliver the reference expanded; here it is read from the
 * facilities module, so a facility's name and slug have one source.
 */
export function createLocalContactRepository(): ContactRepository {
  return {
    async contactPoints() {
      const refs = new Map(
        (await listFacilities()).map((facility) => [facility.id, toFacilityRef(facility)]),
      );
      return contactPointRecords.map((record) => ({
        ...record,
        facility: refFor(refs, record.facility),
      }));
    },

    async switchboards() {
      // One per facility and in facility order. A facility without a switchboard fails the
      // build: it is the number every row of that facility falls back to.
      return (await listFacilities()).map((facility) => {
        const record = switchboardRecords.find((candidate) => candidate.facility === facility.id);
        if (record === undefined) throw new Error(`No switchboard for facility ${facility.id}.`);
        return { ...record, facility: toFacilityRef(facility) };
      });
    },
  };
}
