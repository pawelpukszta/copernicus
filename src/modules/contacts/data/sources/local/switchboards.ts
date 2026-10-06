/**
 * The switchboard each facility answers on, one per facility.
 *
 * A switchboard is what a row falls back to when its own number is unknown: the fallback
 * must be reachable from any record, and it must be one value, not a copy per row that
 * drifts. Numbers come from design/audit-current-site.md.
 */
import type { FacilityId } from '@/modules/facilities';
import type { Switchboard } from '../../../model/switchboard';

/** A switchboard as this source stores it: the facility by id, not yet expanded. */
export type SwitchboardRecord = Omit<Switchboard, 'facility'> & {
  readonly facility: FacilityId;
};

export const switchboardRecords: readonly SwitchboardRecord[] = [
  {
    facility: 'kopernik',
    phone: { number: '+48587640100' },
    // The one entry on the current page that records its hours at all.
    availability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    },
  },
  {
    facility: 'sw-wojciech',
    phone: { number: '+48587684000' },
    availability: { kind: 'unknown' },
  },
  {
    facility: 'wco',
    // Deliberately not 58 341 93 48. That number is published as WCO's contact number on
    // the current site and is the director's secretariat *fax*; the phone is this one.
    // See design/audit-current-site.md, finding 7. The fax is held on the secretariat
    // record's `fax` field, where no view can dial it.
    phone: { number: '+48587324878' },
    // From /kontakt, where the secretariat is the only published way in. Whether WCO has a
    // switchboard of its own is a question for the content owner.
    availability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    },
  },
  {
    facility: 'stomatologia',
    phone: { number: '+48585203837' },
    availability: { kind: 'unknown' },
  },
  {
    facility: 'profilaktyka',
    phone: { number: '+48583005676', extension: '101' },
    availability: { kind: 'unknown' },
  },
];
