import { describe, expect, it } from 'vitest';
import { contactRepository } from '../data/repository';
import { institutionalContactPoints } from './institutional-contact-points';

const contactPoints = await contactRepository.contactPoints();

describe('the institutional block', () => {
  it('keeps press and institutional contacts out of the patient groups', () => {
    const ids = institutionalContactPoints(contactPoints).map((record) => record.id);
    expect(ids).toContain('rzecznik-prasowy');
    expect(ids).toContain('zespol-kontroli-zakazen');
    expect(ids).toContain('kopernik-sekretariat-zarzadu');
    expect(ids).not.toContain('kopernik-sor');
  });
});
