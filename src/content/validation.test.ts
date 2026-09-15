import { describe, expect, it } from 'vitest';
import type { ContactPoint } from './contact-point';
import { facilityRef } from './facilities';
import {
  assertValidContactPoints,
  contentGaps,
  errorsOnly,
  isRoleMailbox,
  isShoutingCaps,
  validateContactPoint,
  validateContactPoints,
} from './validation';

function contactPoint(overrides: Partial<ContactPoint> = {}): ContactPoint {
  return {
    id: 'kopernik-rejestracja',
    slug: 'rejestracja',
    label: { pl: 'Rejestracja przychodni' },
    facility: facilityRef('kopernik'),
    phones: [{ number: '+48587723950' }],
    availability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '18:00' }],
    },
    category: 'registration',
    audience: ['patient'],
    order: 1,
    lastReviewedAt: '2026-09-08',
    ...overrides,
  };
}

function codes(contactPoints: readonly ContactPoint[]): string[] {
  return errorsOnly(validateContactPoints(contactPoints)).map((issue) => issue.code);
}

describe('a well-formed record', () => {
  it('raises nothing', () => {
    expect(validateContactPoint(contactPoint())).toEqual([]);
  });
});

describe('rule 1: numbers are stored as E.164', () => {
  it('rejects a number written the way the current site writes it', () => {
    expect(codes([contactPoint({ phones: [{ number: '58 772 39 50' }] })])).toContain(
      'phone.not-e164',
    );
  });

  it('rejects a fax that is not E.164 either', () => {
    expect(codes([contactPoint({ fax: '58 302 14 16' })])).toContain('fax.not-e164');
  });

  it('rejects an extension that is not digits', () => {
    expect(
      codes([contactPoint({ phones: [{ number: '+48583005676', extension: 'wew. 101' }] })]),
    ).toContain('phone.extension-not-digits');
  });
});

describe('rule 2: a fax may never appear among the phones', () => {
  // design/audit-current-site.md, finding 7: /wazne-telefony publishes WCO's secretariat
  // fax as its contact number, so a patient following the page dials a fax machine.
  it('rejects a record that lists its own fax as a phone', () => {
    const record = contactPoint({
      phones: [{ number: '+48583419348' }],
      fax: '+48583419348',
    });
    expect(codes([record])).toContain('phone.is-fax');
  });

  it('rejects a record that lists a number another record records as a fax', () => {
    const secretariat = contactPoint({
      id: 'wco-sekretariat',
      slug: 'sekretariat',
      phones: [{ number: '+48587324878' }],
      fax: '+48583419348',
    });
    const phonePage = contactPoint({
      id: 'wco-kontakt',
      slug: 'kontakt',
      phones: [{ number: '+48583419348' }],
    });

    expect(codes([secretariat, phonePage])).toContain('phone.is-fax');
    // The record that holds the fax correctly is not itself at fault.
    expect(validateContactPoint(secretariat).filter((i) => i.code === 'phone.is-fax')).toEqual([]);
  });

  it('rejects a number the organisation records as a fax outside this set', () => {
    const issues = validateContactPoints([contactPoint({ phones: [{ number: '+48583021416' }] })], {
      knownFaxNumbers: ['+48583021416'],
    });
    expect(errorsOnly(issues).map((issue) => issue.code)).toContain('phone.is-fax');
  });
});

describe('rule 3: an email is a role mailbox', () => {
  it('accepts a role mailbox', () => {
    expect(isRoleMailbox('rejestracja.wco@copernicus.gda.pl')).toBe(true);
    expect(isRoleMailbox('sekretariat@copernicus.gda.pl')).toBe(true);
  });

  it('rejects an initial and a surname, which no role mailbox looks like', () => {
    expect(isRoleMailbox('a.kowalski@copernicus.gda.pl')).toBe(false);
    expect(codes([contactPoint({ email: 'a.kowalski@copernicus.gda.pl' })])).toContain(
      'email.not-role-mailbox',
    );
  });

  it('rejects a one-word local part only when the staff directory knows it', () => {
    expect(isRoleMailbox('kowalski@copernicus.gda.pl')).toBe(true);
    expect(isRoleMailbox('kowalski@copernicus.gda.pl', ['kowalski'])).toBe(false);
  });

  it('rejects an address that is not an address', () => {
    expect(codes([contactPoint({ email: 'sekretariat at copernicus' })])).toContain(
      'email.malformed',
    );
  });
});

describe('rule 4: unknown availability is a warning, never a silent blank', () => {
  it('does not block the build', () => {
    const issues = validateContactPoint(contactPoint({ availability: { kind: 'unknown' } }));
    expect(errorsOnly(issues)).toEqual([]);
    expect(issues.map((issue) => issue.code)).toContain('availability.unknown');
  });

  it('reaches the content-gap report', () => {
    const gaps = contentGaps([contactPoint({ availability: { kind: 'unknown' } })]);
    expect(gaps.map((gap) => gap.code)).toContain('availability.unknown');
    expect(gaps.every((gap) => gap.contactPointId === 'kopernik-rejestracja')).toBe(true);
  });

  it('rejects hours that do not end after they start', () => {
    const record = contactPoint({
      availability: { kind: 'hours', weekly: [{ days: [1], from: '18:00', to: '07:00' }] },
    });
    expect(codes([record])).toContain('availability.range-not-ordered');
  });

  it('rejects a time that is not a 24-hour clock time', () => {
    const record = contactPoint({
      availability: { kind: 'hours', weekly: [{ days: [1], from: '7.00', to: '15:00' }] },
    });
    expect(codes([record])).toContain('availability.invalid-time');
  });

  it('rejects kind "hours" with no range at all', () => {
    expect(codes([contactPoint({ availability: { kind: 'hours', weekly: [] } })])).toContain(
      'availability.no-weekly-range',
    );
  });

  it('checks exceptions the same way as weekly hours', () => {
    const record = contactPoint({
      availability: {
        kind: 'hours',
        weekly: [{ days: [1, 2, 3, 5], from: '07:30', to: '18:00' }],
        exceptions: [{ days: [4], from: '07:30', to: '25:00' }],
      },
    });
    expect(codes([record])).toContain('availability.invalid-time');
  });
});

describe('rule 5: a number is a value, not an identity', () => {
  it('lets several contact points share one number', () => {
    // 58 772 39 50 serves at least four units today.
    const shared = [
      contactPoint({ id: 'kopernik-rejestracja', slug: 'rejestracja' }),
      contactPoint({
        id: 'wco-rejestracja',
        slug: 'rejestracja-wco',
        facility: facilityRef('wco'),
      }),
      contactPoint({
        id: 'wco-rehabilitacja',
        slug: 'rehabilitacja',
        facility: facilityRef('wco'),
      }),
    ];
    expect(errorsOnly(validateContactPoints(shared))).toEqual([]);
  });

  it('still requires ids to be unique', () => {
    const duplicated = [contactPoint(), contactPoint({ slug: 'rejestracja-2' })];
    expect(codes(duplicated)).toContain('id.duplicate');
  });

  it('requires a slug to be unique within its facility, and no further', () => {
    const sameSlugElsewhere = [
      contactPoint({ id: 'a' }),
      contactPoint({ id: 'b', facility: facilityRef('wco') }),
    ];
    expect(codes(sameSlugElsewhere)).not.toContain('slug.duplicate-in-facility');

    expect(codes([contactPoint({ id: 'a' }), contactPoint({ id: 'b' })])).toContain(
      'slug.duplicate-in-facility',
    );
  });
});

describe('labels', () => {
  it('rejects shouting capitals, which is how the current site writes unit notes', () => {
    expect(isShoutingCaps('PROFILAKTYKA SIMP, PŁATNE')).toBe(true);
    expect(isShoutingCaps('Rejestracja przychodni')).toBe(false);
    // Acronyms are how the units are actually named.
    expect(isShoutingCaps('SOR')).toBe(false);
    expect(isShoutingCaps('Szpitalny Oddział Ratunkowy (SOR)')).toBe(false);

    expect(codes([contactPoint({ label: { pl: 'SZPITALNY ODDZIAŁ RATUNKOWY' } })])).toContain(
      'text.shouting-caps',
    );
  });

  it('holds every locale to the same bounds', () => {
    const record = contactPoint({ label: { pl: 'Rejestracja', en: 'X' } });
    const issues = errorsOnly(validateContactPoint(record));
    expect(issues.map((issue) => issue.path)).toEqual(['label.en']);
    expect(issues[0]?.code).toBe('text.too-short');
  });

  it('rejects a label longer than the model allows', () => {
    expect(codes([contactPoint({ label: { pl: 'R'.repeat(81) } })])).toContain('text.too-long');
  });
});

describe('the shape of a record', () => {
  it('allows at most four numbers', () => {
    const phones = [
      { number: '+48587640100' },
      { number: '+48587640116' },
      { number: '+48587640200' },
      { number: '+48587640300' },
      { number: '+48587640340' },
    ];
    expect(codes([contactPoint({ phones })])).toContain('phones.too-many');
  });

  it('treats a row with no number as a gap, because the switchboard stands in for it', () => {
    const issues = validateContactPoint(contactPoint({ phones: [] }));
    expect(errorsOnly(issues)).toEqual([]);
    expect(issues.map((issue) => issue.code)).toContain('phones.none');
  });

  it('needs at least one audience', () => {
    expect(codes([contactPoint({ audience: [] })])).toContain('audience.empty');
  });

  it('needs a review date, because medical information without one is a liability', () => {
    expect(codes([contactPoint({ lastReviewedAt: '8 września 2026' })])).toContain(
      'lastReviewedAt.not-iso-date',
    );
    expect(codes([contactPoint({ lastReviewedAt: '2026-02-30' })])).toContain(
      'lastReviewedAt.not-iso-date',
    );
  });

  it('rejects a note longer than the model allows', () => {
    expect(codes([contactPoint({ note: { pl: 'x'.repeat(141) } })])).toContain('text.too-long');
  });
});

describe('assertValidContactPoints', () => {
  it('passes a valid set', () => {
    expect(() => {
      assertValidContactPoints([contactPoint()]);
    }).not.toThrow();
  });

  it('names the record, the field and the rule when it fails', () => {
    expect(() => {
      assertValidContactPoints([contactPoint({ phones: [{ number: '58 772 39 50' }] })]);
    }).toThrow(/kopernik-rejestracja: phones\[0\]\.number/);
  });

  it('does not fail on warnings alone', () => {
    expect(() => {
      assertValidContactPoints([contactPoint({ availability: { kind: 'unknown' }, phones: [] })]);
    }).not.toThrow();
  });
});
