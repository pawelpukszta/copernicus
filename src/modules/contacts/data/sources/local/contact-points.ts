/**
 * The contact points, transcribed from design/audit-current-site.md.
 *
 * Every number here was read off the live site on 2026-09-08, or off /kontakt on
 * 2026-09-09 where the two pages disagree. Nothing is invented: a row whose number the
 * current site does not publish carries no phone and renders the facility switchboard as a
 * labelled fallback, which is the decision recorded under "Missing number" in
 * design/screens/wazne-telefony.md.
 *
 * Five of the fifteen audited rows are facility switchboards and live in switchboards.ts
 * instead, so that the number a fallback points at has one source.
 *
 * Records name their facility by id; data/repository.ts expands it into the FacilityRef
 * the model carries, from the facilities module, so a facility's name and slug are never
 * typed out here.
 *
 * Until a CMS is chosen, editing a number here is how a number changes.
 */
import type { FacilityId } from '@/modules/facilities';
import type { ContactPoint } from '../../../model/contact-point';

/** A contact point as this source stores it: the facility by id, not yet expanded. */
export type ContactPointRecord = Omit<ContactPoint, 'facility'> & {
  readonly facility: FacilityId;
};

/** The date the numbers were read off the current site. */
const AUDITED = '2026-09-08';
/** The date /kontakt was read, which is where the WCO correction comes from. */
const AUDITED_KONTAKT = '2026-09-09';

export const contactPointRecords: readonly ContactPointRecord[] = [
  {
    id: 'kopernik-sor',
    slug: 'szpitalny-oddzial-ratunkowy',
    label: { pl: 'Szpitalny Oddział Ratunkowy' },
    facility: 'kopernik',
    phones: [{ number: '+48587640116' }],
    // The current site implies round-the-clock cover but never states it. An emergency
    // department is exactly where an unverified claim must not be published, so this stays
    // unknown and appears in the content-gap report until the hospital confirms it.
    availability: { kind: 'unknown' },
    category: 'emergency',
    audience: ['patient'],
    order: 1,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'noc-swiateczna',
    slug: 'nocna-i-swiateczna-opieka-zdrowotna',
    label: { pl: 'Nocna i świąteczna opieka zdrowotna' },
    facility: 'kopernik',
    // The current site publishes a link labelled "TUTAJ" here and no number at all, which
    // is the gap that a worried parent hits at 22:00. Fallback until it is filled.
    phones: [],
    availability: { kind: 'unknown' },
    category: 'out-of-hours',
    audience: ['patient'],
    order: 2,
    lastReviewedAt: AUDITED,
  },

  {
    id: 'kopernik-rejestracja-przychodni',
    slug: 'rejestracja-przychodni',
    label: { pl: 'Rejestracja przychodni' },
    facility: 'kopernik',
    // The same number serves at least four units across the group. It is a value on the
    // record, never the record's identity.
    phones: [{ number: '+48587723950' }],
    availability: { kind: 'unknown' },
    category: 'registration',
    audience: ['patient'],
    order: 1,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'kopernik-rejestracja-diagnostyki-obrazowej',
    slug: 'rejestracja-diagnostyki-obrazowej',
    label: { pl: 'Rejestracja diagnostyki obrazowej' },
    facility: 'kopernik',
    phones: [{ number: '+48587640200' }, { number: '+48587640300' }],
    availability: { kind: 'unknown' },
    category: 'diagnostics',
    audience: ['patient'],
    order: 2,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'kopernik-rejestracja-poradnie-specjalistyczne',
    slug: 'rejestracja-do-poradni-specjalistycznych',
    label: { pl: 'Rejestracja do poradni specjalistycznych' },
    facility: 'kopernik',
    phones: [],
    availability: { kind: 'unknown' },
    category: 'registration',
    audience: ['patient'],
    order: 3,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'kopernik-zaklady-diagnostyki-obrazowej',
    slug: 'zaklady-diagnostyki-obrazowej',
    label: { pl: 'Zakłady diagnostyki obrazowej' },
    facility: 'kopernik',
    phones: [],
    availability: { kind: 'unknown' },
    category: 'diagnostics',
    audience: ['patient'],
    order: 4,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'kopernik-sekretariat-zarzadu',
    slug: 'sekretariat-zarzadu',
    label: { pl: 'Sekretariat zarządu' },
    facility: 'kopernik',
    phones: [{ number: '+48587640142' }, { number: '+48587640340' }],
    // Held here, in its own field, so that no view can render it as something to call.
    fax: '+48583021416',
    // The site says "od poniedziałku do piątku" without hours, which the model cannot
    // express: a range needs a start and an end.
    availability: { kind: 'unknown' },
    category: 'secretariat',
    audience: ['institution'],
    order: 1,
    lastReviewedAt: AUDITED,
  },

  {
    id: 'wco-sekretariat-dyrekcji',
    slug: 'sekretariat-dyrekcji',
    label: { pl: 'Sekretariat dyrekcji' },
    facility: 'wco',
    // /wazne-telefony publishes 58 341 93 48 as the number to call WCO on. /kontakt records
    // that exact number as this secretariat's fax; the phone is 58 732 48 78. Someone
    // following the phone page today dials a fax machine. The fax sits in `fax`, where
    // validateContactPoints also makes it unusable as a phone on any other record.
    phones: [{ number: '+48587324878' }],
    fax: '+48583419348',
    email: 'sekretariat.wco@copernicus.gda.pl',
    availability: {
      kind: 'hours',
      weekly: [{ days: [1, 2, 3, 4, 5], from: '07:00', to: '15:00' }],
    },
    category: 'secretariat',
    audience: ['institution'],
    order: 1,
    lastReviewedAt: AUDITED_KONTAKT,
  },
  {
    id: 'wco-infolinia-onkologiczna',
    slug: 'infolinia-onkologiczna',
    label: { pl: 'Infolinia onkologiczna' },
    facility: 'wco',
    phones: [],
    availability: { kind: 'unknown' },
    category: 'registration',
    audience: ['patient'],
    order: 2,
    lastReviewedAt: AUDITED,
  },

  {
    id: 'rzecznik-prasowy',
    slug: 'rzecznik-prasowy',
    label: { pl: 'Rzecznik prasowy' },
    facility: 'kopernik',
    phones: [],
    availability: { kind: 'unknown' },
    category: 'press',
    audience: ['media'],
    order: 1,
    lastReviewedAt: AUDITED,
  },
  {
    id: 'zespol-kontroli-zakazen',
    slug: 'zespol-kontroli-do-spraw-zakazen',
    label: { pl: 'Zespół kontroli do spraw zakażeń' },
    facility: 'kopernik',
    phones: [],
    availability: { kind: 'unknown' },
    category: 'institutional',
    audience: ['institution'],
    order: 2,
    lastReviewedAt: AUDITED,
  },
];
