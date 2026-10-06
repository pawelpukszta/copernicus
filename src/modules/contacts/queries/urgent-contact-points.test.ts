import { describe, expect, it } from 'vitest';
import { contactRepository } from '../data/repository';
import { urgentContactPoints } from './urgent-contact-points';

const contactPoints = await contactRepository.contactPoints();

describe('the Pilne block', () => {
  it('holds the emergency and out-of-hours numbers a patient needs, in order', () => {
    expect(urgentContactPoints(contactPoints).map((record) => record.id)).toEqual([
      'kopernik-sor',
      'noc-swiateczna',
    ]);
  });

  it('carries nothing administrative', () => {
    for (const record of urgentContactPoints(contactPoints)) {
      expect(['emergency', 'out-of-hours']).toContain(record.category);
    }
  });
});
