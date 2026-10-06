import type { FacilityId } from '@/modules/facilities';
import { contactRepository } from '../data/repository';
import type { Switchboard } from '../model/switchboard';
import { switchboardOf } from '../model/switchboard';

/** The number one facility answers on. */
export async function getSwitchboard(facilityId: FacilityId): Promise<Switchboard> {
  return switchboardOf(await contactRepository.switchboards(), facilityId);
}
