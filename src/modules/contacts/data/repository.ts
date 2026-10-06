import type { ContactPoint } from '../model/contact-point';
import type { Switchboard } from '../model/switchboard';
import { createLocalContactRepository } from './sources/local';

export interface ContactRepository {
  contactPoints(): Promise<readonly ContactPoint[]>;
  /** One per facility, in the order the site lists facilities. */
  switchboards(): Promise<readonly Switchboard[]>;
}

// The active source. Switching to the CMS is this line plus the cms/ folder; nothing above
// data/ changes.
export const contactRepository: ContactRepository = createLocalContactRepository();
