/**
 * What a row shows when its own number is unknown.
 *
 * The decision, from design/screens/wazne-telefony.md: the row stays and renders the
 * facility switchboard, labelled so the substitution is visible. Hiding the row is cleaner
 * visually but conceals from the patient that the unit exists; "numer w przygotowaniu"
 * alone is honest but leaves them with no way to reach anyone, and after six months reads
 * as neglect. The fallback keeps a path to a human, which is the page's job.
 *
 * It is resolved here rather than in the view because /kontakt and /szpitale/[slug] render
 * the same records and must substitute the same way.
 */
import type { Availability, ContactPoint, Facility, Phone } from './contact-point';
import { getFacility } from './facilities';

export type ResolvedPhones =
  | { readonly kind: 'own'; readonly phones: readonly Phone[] }
  | {
      readonly kind: 'fallback';
      readonly phones: readonly [Phone];
      readonly facility: Facility;
      readonly availability: Availability;
    };

/**
 * The numbers to render for one contact point, and whether they are its own.
 *
 * A `fallback` result must be labelled as such by the caller; rendering it as if it were
 * the unit's own number is the failure this type exists to prevent, and is why the
 * substitution is a variant rather than a silently swapped array.
 */
export function resolvePhones(contactPoint: ContactPoint): ResolvedPhones {
  if (contactPoint.phones.length > 0) {
    return { kind: 'own', phones: contactPoint.phones };
  }

  const facility = getFacility(contactPoint.facility.id);
  return {
    kind: 'fallback',
    phones: [facility.switchboard],
    facility,
    // The switchboard's hours, not the unit's: what the visitor is being told is when the
    // number they are given is answered.
    availability: facility.switchboardAvailability,
  };
}

/** True when the route is showing a switchboard in place of a number nobody has yet. */
export function isFallback(contactPoint: ContactPoint): boolean {
  return resolvePhones(contactPoint).kind === 'fallback';
}
