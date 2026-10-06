/**
 * Validation of contact points, re-checked at build.
 *
 * The rules come from design/screens/wazne-telefony.md and each one exists because the
 * current site breaks it. They are enforced here rather than in a view because all three
 * views render the same records: a rule that lives in a page is a rule the next page does
 * not have.
 *
 * Messages are developer-facing and therefore English, like every comment in this
 * repository. Nothing here is rendered to a visitor.
 */
import type { LocalizedText } from '@/shared/i18n';
import { locales } from '@/shared/i18n';
import { isE164, isExtension } from '@/shared/lib/phone';
import type { ContactPoint, Phone } from './contact-point';
import {
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PHONES_PER_CONTACT_POINT,
  MAX_PHONE_NOTE_LENGTH,
  MIN_LABEL_LENGTH,
  contactAudiences,
  contactCategories,
} from './contact-point';
import type { Switchboard } from './switchboard';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  readonly severity: IssueSeverity;
  /** Stable machine-readable code, e.g. "phone.not-e164". */
  readonly code: string;
  /** Path inside the record, e.g. "phones[0].number". */
  readonly path: string;
  readonly message: string;
  readonly contactPointId: string;
}

export interface ValidationContext {
  /**
   * Local parts of staff mailboxes. A single-word local part is only rejected when it
   * matches one, because "rejestracja" and "kowalski" are the same shape. Empty until the
   * staff directory is available, which is recorded as a content gap rather than hidden.
   */
  readonly staffDirectory?: readonly string[];
  /**
   * Fax numbers known from elsewhere, in E.164. Fax numbers carried by the records under
   * validation are added to this set automatically.
   */
  readonly knownFaxNumbers?: readonly string[];
  /**
   * The switchboards a record without a number falls back to. The model does not read data,
   * so the caller passes them; without them the "leads nowhere" rule cannot be decided and
   * is skipped. The shipped records are always validated with them.
   */
  readonly switchboards?: readonly Switchboard[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** "a.kowalski": an initial, a dot and a name. No role mailbox has this shape. */
const PERSON_INITIAL_DOT = /^[a-z]\.[a-z]+$/;
const SINGLE_WORD = /^[a-z]+$/;

function issue(
  severity: IssueSeverity,
  contactPointId: string,
  code: string,
  path: string,
  message: string,
): ValidationIssue {
  return { severity, code, path, message, contactPointId };
}

/** Letters only, so punctuation and digits do not decide whether a label is shouting. */
function letters(value: string): string {
  return (value.match(/\p{L}/gu) ?? []).join('');
}

/**
 * True for "PROFILAKTYKA SIMP, PLATNE" and false for "Rejestracja (SOR)".
 *
 * Acronyms of up to three letters pass, because SOR, WCO and NFZ are how the units are
 * actually named; a run of four or more capitals is a sentence written in shouting caps.
 */
export function isShoutingCaps(value: string): boolean {
  const onlyLetters = letters(value);
  if (onlyLetters.length < 4) return false;
  const upper = onlyLetters.toLocaleUpperCase('pl');
  return onlyLetters === upper && onlyLetters !== onlyLetters.toLocaleLowerCase('pl');
}

/**
 * Rule 3: an email on a contact point is a role mailbox. One unit currently publishes an
 * employee's personal address, which is a maintenance problem when the person changes
 * role and a personal-data question in its own right.
 */
export function isRoleMailbox(email: string, staffDirectory: readonly string[] = []): boolean {
  const localPart = email.slice(0, email.lastIndexOf('@')).toLocaleLowerCase('pl');
  if (PERSON_INITIAL_DOT.test(localPart)) return false;
  if (SINGLE_WORD.test(localPart) && staffDirectory.includes(localPart)) return false;
  return true;
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateLocalizedText(
  value: LocalizedText,
  id: string,
  path: string,
  bounds: { min?: number; max: number },
): ValidationIssue[] {
  const min = bounds.min ?? 0;
  const max = bounds.max;
  const issues: ValidationIssue[] = [];

  for (const locale of locales) {
    const translation = value[locale];
    if (translation === undefined) continue;
    const length = [...translation].length;

    if (length < min) {
      issues.push(
        issue(
          'error',
          id,
          'text.too-short',
          `${path}.${locale}`,
          `Must be at least ${min} characters, is ${length}.`,
        ),
      );
    }
    if (length > max) {
      issues.push(
        issue(
          'error',
          id,
          'text.too-long',
          `${path}.${locale}`,
          `Must be at most ${max} characters, is ${length}.`,
        ),
      );
    }
    if (isShoutingCaps(translation)) {
      issues.push(
        issue(
          'error',
          id,
          'text.shouting-caps',
          `${path}.${locale}`,
          `Written in shouting capitals: ${JSON.stringify(translation)}. Use sentence case.`,
        ),
      );
    }
  }

  return issues;
}

function validatePhone(
  phone: Phone,
  id: string,
  path: string,
  faxNumbers: ReadonlySet<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Rule 1: storage is E.164, so that one display format can be derived for every view.
  if (!isE164(phone.number)) {
    issues.push(
      issue(
        'error',
        id,
        'phone.not-e164',
        `${path}.number`,
        `Must be E.164, for example "+48587640116", received ${JSON.stringify(phone.number)}.`,
      ),
    );
  }

  // Rule 2: a fax may never appear among the phones. /wazne-telefony currently lists WCO's
  // secretariat fax as its phone number, so someone following the page dials a fax machine.
  if (faxNumbers.has(phone.number)) {
    issues.push(
      issue(
        'error',
        id,
        'phone.is-fax',
        `${path}.number`,
        `${phone.number} is recorded as a fax number and must not be listed as a phone.`,
      ),
    );
  }

  if (phone.extension !== undefined && !isExtension(phone.extension)) {
    issues.push(
      issue(
        'error',
        id,
        'phone.extension-not-digits',
        `${path}.extension`,
        `Extension must be digits only, received ${JSON.stringify(phone.extension)}.`,
      ),
    );
  }

  if (phone.label !== undefined) {
    issues.push(...validateLocalizedText(phone.label, id, `${path}.label`, { max: 60 }));
  }
  if (phone.note !== undefined) {
    issues.push(
      ...validateLocalizedText(phone.note, id, `${path}.note`, { max: MAX_PHONE_NOTE_LENGTH }),
    );
  }

  return issues;
}

function validateAvailability(contactPoint: ContactPoint): ValidationIssue[] {
  const { availability, id } = contactPoint;

  // Rule 4: unknown is allowed, is never a silent blank, and is a content gap with an owner.
  if (availability.kind === 'unknown') {
    return [
      issue(
        'warning',
        id,
        'availability.unknown',
        'availability',
        'Availability is unknown. It renders as "Godziny do potwierdzenia" and belongs in the content-gap report.',
      ),
    ];
  }

  if (availability.kind !== 'hours') return [];

  const issues: ValidationIssue[] = [];
  const weeklyCount = availability.weekly.length;
  const ranges = [...availability.weekly, ...(availability.exceptions ?? [])];

  if (weeklyCount === 0) {
    issues.push(
      issue(
        'error',
        id,
        'availability.no-weekly-range',
        'availability.weekly',
        'Availability of kind "hours" needs at least one weekly range.',
      ),
    );
  }

  ranges.forEach((range, index) => {
    const path =
      index < weeklyCount
        ? `availability.weekly[${index}]`
        : `availability.exceptions[${index - weeklyCount}]`;

    if (range.days.length === 0) {
      issues.push(
        issue('error', id, 'availability.no-days', `${path}.days`, 'Needs at least one day.'),
      );
    }
    if (new Set(range.days).size !== range.days.length) {
      issues.push(
        issue('error', id, 'availability.duplicate-days', `${path}.days`, 'Lists a day twice.'),
      );
    }
    for (const time of [range.from, range.to] as const) {
      if (!TIME_24H.test(time)) {
        issues.push(
          issue(
            'error',
            id,
            'availability.invalid-time',
            path,
            `Time must be "HH:MM" on a 24-hour clock, received ${JSON.stringify(time)}.`,
          ),
        );
      }
    }
    if (TIME_24H.test(range.from) && TIME_24H.test(range.to) && range.from >= range.to) {
      issues.push(
        issue(
          'error',
          id,
          'availability.range-not-ordered',
          path,
          `${range.from}-${range.to} does not end after it starts. Round-the-clock cover is kind "24/7".`,
        ),
      );
    }
  });

  return issues;
}

/**
 * Validates one record. Cross-record rules (duplicate ids, and a fax published as a phone
 * by a different record) need the whole set and live in validateContactPoints.
 */
export function validateContactPoint(
  contactPoint: ContactPoint,
  context: ValidationContext = {},
): ValidationIssue[] {
  const { id } = contactPoint;
  const issues: ValidationIssue[] = [];
  const faxNumbers = new Set<string>(context.knownFaxNumbers ?? []);
  if (contactPoint.fax !== undefined) faxNumbers.add(contactPoint.fax);

  issues.push(
    ...validateLocalizedText(contactPoint.label, id, 'label', {
      min: MIN_LABEL_LENGTH,
      max: MAX_LABEL_LENGTH,
    }),
  );

  if (contactPoint.note !== undefined) {
    issues.push(...validateLocalizedText(contactPoint.note, id, 'note', { max: MAX_NOTE_LENGTH }));
  }

  if (contactPoint.phones.length > MAX_PHONES_PER_CONTACT_POINT) {
    issues.push(
      issue(
        'error',
        id,
        'phones.too-many',
        'phones',
        `At most ${MAX_PHONES_PER_CONTACT_POINT} numbers, has ${contactPoint.phones.length}.`,
      ),
    );
  }

  contactPoint.phones.forEach((phone, index) => {
    issues.push(...validatePhone(phone, id, `phones[${index}]`, faxNumbers));
  });

  // "At least one phone or an email" and "a row with no number falls back to the facility
  // switchboard" are both in the spec, and nine rows have no number today, so the first
  // read as written would stop the route shipping at all. What the rule protects is that a
  // contact point always leads somewhere, and the fallback satisfies that. The error is
  // therefore kept for the case the rule is really about: a record that leads nowhere.
  const hasSwitchboard =
    context.switchboards === undefined ||
    context.switchboards.some((candidate) => candidate.facility.id === contactPoint.facility.id);
  if (contactPoint.phones.length === 0 && contactPoint.email === undefined && !hasSwitchboard) {
    issues.push(
      issue(
        'error',
        id,
        'contact.no-channel',
        'phones',
        `No phone, no email, and facility ${contactPoint.facility.id} has no switchboard to fall back to.`,
      ),
    );
  }

  // A row without a number still renders: it shows the facility switchboard, labelled, so
  // the visitor keeps a path to a human. That substitution is a gap, not a resting state.
  if (contactPoint.phones.length === 0) {
    issues.push(
      issue(
        'warning',
        id,
        'phones.none',
        'phones',
        'No number. The facility switchboard is rendered as a labelled fallback.',
      ),
    );
  }

  if (contactPoint.fax !== undefined && !isE164(contactPoint.fax)) {
    issues.push(
      issue(
        'error',
        id,
        'fax.not-e164',
        'fax',
        `Must be E.164, received ${JSON.stringify(contactPoint.fax)}.`,
      ),
    );
  }

  if (contactPoint.email !== undefined) {
    if (!EMAIL.test(contactPoint.email)) {
      issues.push(
        issue(
          'error',
          id,
          'email.malformed',
          'email',
          `Not an email address: ${JSON.stringify(contactPoint.email)}.`,
        ),
      );
    } else if (!isRoleMailbox(contactPoint.email, context.staffDirectory)) {
      issues.push(
        issue(
          'error',
          id,
          'email.not-role-mailbox',
          'email',
          `${contactPoint.email} looks like a named person's mailbox. A contact point carries a role mailbox.`,
        ),
      );
    }
  }

  issues.push(...validateAvailability(contactPoint));

  if (contactPoint.audience.length === 0) {
    issues.push(issue('error', id, 'audience.empty', 'audience', 'Needs at least one audience.'));
  }
  for (const audience of contactPoint.audience) {
    if (!(contactAudiences as readonly string[]).includes(audience)) {
      issues.push(
        issue('error', id, 'audience.unknown', 'audience', `Unknown audience ${audience}.`),
      );
    }
  }
  if (!(contactCategories as readonly string[]).includes(contactPoint.category)) {
    issues.push(
      issue(
        'error',
        id,
        'category.unknown',
        'category',
        `Unknown category ${contactPoint.category}.`,
      ),
    );
  }

  if (!Number.isInteger(contactPoint.order)) {
    issues.push(
      issue(
        'error',
        id,
        'order.not-integer',
        'order',
        `Must be an integer, is ${contactPoint.order}.`,
      ),
    );
  }

  if (!isIsoDate(contactPoint.lastReviewedAt)) {
    issues.push(
      issue(
        'error',
        id,
        'lastReviewedAt.not-iso-date',
        'lastReviewedAt',
        `Must be an ISO date, YYYY-MM-DD, received ${JSON.stringify(contactPoint.lastReviewedAt)}.`,
      ),
    );
  }

  return issues;
}

/**
 * Validates a whole set. Every fax in the set becomes a number that no record may list as
 * a phone, which is what catches the actual defect on the current site: the fax is
 * published by /wazne-telefony while /kontakt records it correctly on another entry.
 *
 * Rule 5 is a deliberate absence: several contact points may carry the same number, so
 * numbers are never checked for uniqueness. 58 772 39 50 serves at least four units.
 */
export function validateContactPoints(
  contactPoints: readonly ContactPoint[],
  context: ValidationContext = {},
): ValidationIssue[] {
  const faxNumbers = new Set<string>(context.knownFaxNumbers ?? []);
  for (const contactPoint of contactPoints) {
    if (contactPoint.fax !== undefined) faxNumbers.add(contactPoint.fax);
  }

  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const contactPoint of contactPoints) {
    issues.push(
      ...validateContactPoint(contactPoint, { ...context, knownFaxNumbers: [...faxNumbers] }),
    );

    if (seenIds.has(contactPoint.id)) {
      issues.push(
        issue('error', contactPoint.id, 'id.duplicate', 'id', `Duplicate id ${contactPoint.id}.`),
      );
    }
    seenIds.add(contactPoint.id);

    const withinFacility = `${contactPoint.facility.id}/${contactPoint.slug}`;
    if (seenSlugs.has(withinFacility)) {
      issues.push(
        issue(
          'error',
          contactPoint.id,
          'slug.duplicate-in-facility',
          'slug',
          `Slug ${contactPoint.slug} is used twice within ${contactPoint.facility.id}.`,
        ),
      );
    }
    seenSlugs.add(withinFacility);
  }

  return issues;
}

export function errorsOnly(issues: readonly ValidationIssue[]): ValidationIssue[] {
  return issues.filter((candidate) => candidate.severity === 'error');
}

/**
 * The content-gap report: what an editor has to chase, with the record that needs it.
 * Nine numbers are unknown today, so this is the artefact that keeps them from settling in.
 */
export function contentGaps(
  contactPoints: readonly ContactPoint[],
  context: ValidationContext = {},
): ValidationIssue[] {
  return validateContactPoints(contactPoints, context).filter(
    (candidate) => candidate.severity === 'warning',
  );
}

/**
 * Build-time gate. A hospital phone page that renders a number nobody answers is worse
 * than one that fails to build.
 */
export function assertValidContactPoints(
  contactPoints: readonly ContactPoint[],
  context: ValidationContext = {},
): void {
  const errors = errorsOnly(validateContactPoints(contactPoints, context));
  if (errors.length === 0) return;
  const detail = errors
    .map((error) => `  ${error.contactPointId}: ${error.path}: ${error.message} [${error.code}]`)
    .join('\n');
  throw new Error(`${errors.length} invalid contact point field(s):\n${detail}`);
}
