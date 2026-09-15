import { describe, expect, it } from 'vitest';
import { contactPoints, emergencyNumber } from './contact-points';
import { facilities, facilityOrder } from './facilities';
import { formatPhoneNumber, isE164, telHref } from './phone';
import { assertValidContactPoints, contentGaps } from './validation';

describe('the shipped records', () => {
  it('pass validation, which is what "re-checked at build" means', () => {
    expect(() => {
      assertValidContactPoints(contactPoints);
    }).not.toThrow();
  });

  it('store every number as E.164, so one display format can be derived', () => {
    for (const record of contactPoints) {
      for (const phone of record.phones) {
        expect(isE164(phone.number), `${record.id}: ${phone.number}`).toBe(true);
        expect(() => formatPhoneNumber(phone.number)).not.toThrow();
      }
    }
  });

  it('never publish WCO’s fax as a number to call', () => {
    // design/audit-current-site.md, finding 7. This is the defect that decided the shape of
    // the content model, so it is asserted against the real data and not only in the unit
    // tests for the rule.
    const fax = '+48583419348';
    const everyPhone = contactPoints.flatMap((record) =>
      record.phones.map((phone) => phone.number),
    );
    expect(everyPhone).not.toContain(fax);

    const secretariat = contactPoints.find((record) => record.id === 'wco-sekretariat-dyrekcji');
    expect(secretariat?.fax).toBe(fax);
    expect(secretariat?.phones.map((phone) => phone.number)).toEqual(['+48587324878']);
  });

  it('keep the numbers the current site does publish', () => {
    const byId = new Map(contactPoints.map((record) => [record.id, record]));
    const audited: ReadonlyArray<readonly [string, readonly string[]]> = [
      ['kopernik-sor', ['+48587640116']],
      ['kopernik-rejestracja-przychodni', ['+48587723950']],
      ['kopernik-rejestracja-diagnostyki-obrazowej', ['+48587640200', '+48587640300']],
      ['kopernik-sekretariat-zarzadu', ['+48587640142', '+48587640340']],
      ['wco-sekretariat-dyrekcji', ['+48587324878']],
    ];

    for (const [id, numbers] of audited) {
      expect(
        byId.get(id)?.phones.map((phone) => phone.number),
        id,
      ).toEqual(numbers);
    }
  });

  it('give every record a facility that exists', () => {
    for (const record of contactPoints) {
      expect(facilityOrder, record.id).toContain(record.facility.id);
      expect(record.facility.slug).toBe(facilities[record.facility.id].slug);
    }
  });

  it('list the unknown numbers in the content-gap report rather than hiding them', () => {
    const gaps = contentGaps(contactPoints);
    const withoutNumber = gaps
      .filter((gap) => gap.code === 'phones.none')
      .map((gap) => gap.contactPointId);

    // The six entries the current site leaves without a number. They ship with the
    // switchboard fallback; they do not ship unnoticed.
    expect(withoutNumber.sort()).toEqual(
      [
        'kopernik-rejestracja-poradnie-specjalistyczne',
        'kopernik-zaklady-diagnostyki-obrazowej',
        'noc-swiateczna',
        'rzecznik-prasowy',
        'wco-infolinia-onkologiczna',
        'zespol-kontroli-zakazen',
      ].sort(),
    );
  });

  it('does not claim hours the hospital has not confirmed', () => {
    const sor = contactPoints.find((record) => record.id === 'kopernik-sor');
    expect(sor?.availability.kind).toBe('unknown');
  });

  it('holds one record per audited entry, with the switchboards on the facilities', () => {
    expect(contactPoints).toHaveLength(11);
    expect(facilityOrder).toHaveLength(5);
  });
});

describe('the emergency number', () => {
  it('is a constant, not a record an editor can retype', () => {
    expect(emergencyNumber.code).toBe('112');
    expect(telHref(emergencyNumber.code)).toBe('tel:112');
  });
});

describe('the facilities', () => {
  it('each answer on a number that can be dialled', () => {
    for (const id of facilityOrder) {
      const facility = facilities[id];
      expect(isE164(facility.switchboard.number), id).toBe(true);
      expect(() =>
        telHref(facility.switchboard.number, facility.switchboard.extension),
      ).not.toThrow();
    }
  });

  it('carry the Profilaktyka extension rather than folding it into the number', () => {
    expect(facilities.profilaktyka.switchboard).toEqual({
      number: '+48583005676',
      extension: '101',
    });
    expect(telHref('+48583005676', '101')).toBe('tel:+48583005676;ext=101');
  });
});
