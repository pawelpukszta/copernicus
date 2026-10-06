import type { ContactPoint } from '../model/contact-point';
import type { ContactFilter } from './contact-filter';
import { matchesFilter, sortContactPoints } from './contact-filter';

/** Press, media and institutional contacts, kept apart from patient contacts. */
export function institutionalContactPoints(
  contactPoints: readonly ContactPoint[],
  filter: ContactFilter = {},
): readonly ContactPoint[] {
  return sortContactPoints(
    contactPoints.filter(
      (record) =>
        (record.audience.includes('media') || record.audience.includes('institution')) &&
        matchesFilter(record, filter),
    ),
    filter.sort,
  );
}
