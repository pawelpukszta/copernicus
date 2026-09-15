/**
 * Phone numbers: storage format, display format and dial links.
 *
 * The current site writes one number three ways (`58 76 40100`, `58 764 01 00`,
 * `58 76 40 200`), which makes numbers harder to read aloud, harder to dial and impossible
 * to deduplicate. See design/audit-current-site.md, finding 4. Storage is therefore E.164
 * and the display format is derived here, never authored.
 */

/** E.164: a leading plus, a non-zero country code digit, at most fifteen digits in total. */
const E164 = /^\+[1-9]\d{1,14}$/;

const POLAND = '+48';

/**
 * Two-digit prefixes of Polish mobile numbers. They group 3-3-3, whereas geographic
 * numbers group 2-3-2-2 around their area code. Both groupings are how the numbers are
 * read aloud, which is what the display format is for.
 */
const PL_MOBILE_PREFIXES = new Set([
  '45',
  '50',
  '51',
  '53',
  '57',
  '60',
  '66',
  '69',
  '72',
  '73',
  '78',
  '79',
  '88',
]);

/**
 * Emergency numbers are short codes, not E.164, and belong to the state rather than to a
 * facility. They are kept out of `Phone` for that reason: `Phone.number` stays strictly
 * E.164 so no authoring path can smuggle a three-digit string into a facility record.
 */
export const emergencyShortCodes = ['112', '997', '998', '999'] as const;

export type EmergencyShortCode = (typeof emergencyShortCodes)[number];

export function isEmergencyShortCode(value: string): value is EmergencyShortCode {
  return (emergencyShortCodes as readonly string[]).includes(value);
}

export function isE164(value: string): boolean {
  return E164.test(value);
}

/** Digits only, at least one, and no leading zero-length string. */
const EXTENSION = /^\d{1,6}$/;

export function isExtension(value: string): boolean {
  return EXTENSION.test(value);
}

function groupDigits(digits: string, sizes: readonly number[]): string {
  const parts: string[] = [];
  let index = 0;
  for (const size of sizes) {
    if (index >= digits.length) break;
    parts.push(digits.slice(index, index + size));
    index += size;
  }
  if (index < digits.length) parts.push(digits.slice(index));
  return parts.join(' ');
}

/**
 * Turns a stored number into the one grouping the site uses: `+48587640116` renders as
 * `58 764 01 16`.
 *
 * Polish numbers drop the country code, because nobody in Gdansk dials it and the leading
 * `+48` pushes the part that identifies the unit off the end of a narrow row. Numbers from
 * other countries keep their plus and are grouped in threes: the site has none today, and
 * inventing a per-country grouping rule would be a guess.
 *
 * @throws TypeError when the value is not E.164. A number that cannot be dialled must fail
 * loudly at build time rather than render as a broken link.
 */
export function formatPhoneNumber(e164: string): string {
  if (!isE164(e164)) {
    throw new TypeError(
      `Phone number must be E.164, for example "+48587640116", received ${JSON.stringify(e164)}.`,
    );
  }

  if (e164.startsWith(POLAND)) {
    const national = e164.slice(POLAND.length);
    // Polish numbers are nine digits. Anything else is a data error that formatting must
    // not paper over, so it falls through to the neutral grouping below.
    if (national.length === 9) {
      const prefix = national.slice(0, 2);
      return PL_MOBILE_PREFIXES.has(prefix)
        ? groupDigits(national, [3, 3, 3])
        : groupDigits(national, [2, 3, 2, 2]);
    }
  }

  return `+${groupDigits(e164.slice(1), [3, 3, 3, 3])}`;
}

/**
 * The `tel:` target. Extensions use the RFC 3966 `;ext=` parameter rather than being
 * appended to the digits, so a dialler that cannot handle extensions still reaches the
 * switchboard instead of dialling a number that does not exist.
 */
export function telHref(number: string, extension?: string): string {
  if (isEmergencyShortCode(number)) return `tel:${number}`;
  if (!isE164(number)) {
    throw new TypeError(
      `Cannot build a tel: link from ${JSON.stringify(number)}: expected E.164 or an emergency short code.`,
    );
  }
  if (extension === undefined) return `tel:${number}`;
  if (!isExtension(extension)) {
    throw new TypeError(`Extension must be digits only, received ${JSON.stringify(extension)}.`);
  }
  return `tel:${number};ext=${extension}`;
}

/** Display form of an emergency short code. Short codes are read as written. */
export function formatEmergencyShortCode(code: EmergencyShortCode): string {
  return code;
}
