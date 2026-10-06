import type { Facility } from '@/modules/facilities';
import { listFacilities } from '@/modules/facilities';
import { contactRepository } from '../data/repository';
import type { Switchboard } from '../model/switchboard';
import { switchboardOf } from '../model/switchboard';

/** A facility with the number it answers on: what every list of facilities shows. */
export interface FacilitySwitchboard {
  readonly facility: Facility;
  readonly switchboard: Switchboard;
}

/** Every facility with its switchboard, in the order the site lists facilities. */
export async function listFacilitySwitchboards(): Promise<readonly FacilitySwitchboard[]> {
  const [facilities, switchboards] = await Promise.all([
    listFacilities(),
    contactRepository.switchboards(),
  ]);
  return facilities.map((facility) => ({
    facility,
    switchboard: switchboardOf(switchboards, facility.id),
  }));
}
