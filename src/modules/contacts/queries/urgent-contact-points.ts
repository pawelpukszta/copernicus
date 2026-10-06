import type { ContactPoint } from '../model/contact-point';
import { sortContactPoints } from './contact-filter';

/**
 * The Pilne block on /wazne-telefony: what someone in a hurry needs, above everything else.
 * Never filtered, because a query that matches nothing must not take the emergency numbers
 * off the page.
 */
export function urgentContactPoints(
  contactPoints: readonly ContactPoint[],
): readonly ContactPoint[] {
  return sortContactPoints(
    contactPoints.filter(
      (record) =>
        (record.category === 'emergency' || record.category === 'out-of-hours') &&
        record.audience.includes('patient'),
    ),
  );
}
