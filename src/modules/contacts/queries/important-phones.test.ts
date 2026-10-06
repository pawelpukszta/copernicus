import { describe, expect, it } from 'vitest';
import { getImportantPhones } from './important-phones';

describe('what /wazne-telefony renders', () => {
  it('resolves every row, so a row without a number always arrives as a labelled fallback', async () => {
    const view = await getImportantPhones();
    const rows = [
      ...view.urgent,
      ...view.groups.flatMap((group) => group.rows),
      ...view.institutional,
    ];

    expect(rows.length).toBeGreaterThan(0);
    for (const { contactPoint, phones } of rows) {
      expect(phones.kind, contactPoint.id).toBe(
        contactPoint.phones.length === 0 ? 'fallback' : 'own',
      );
    }
  });

  it('reads the filter from the query string and still offers every facility to choose from', async () => {
    const view = await getImportantPhones({ placowka: 'wco' });

    expect(view.filtered).toBe(true);
    expect(view.groups.map((group) => group.facility.id)).toEqual(['wco']);
    expect(view.facilities).toHaveLength(5);
  });

  it('keeps Pilne when the filter leaves nothing', async () => {
    const view = await getImportantPhones({ q: 'kardiologia dziecięca' });

    expect(view.found).toBe(0);
    expect(view.urgent.length).toBeGreaterThan(0);
  });
});
