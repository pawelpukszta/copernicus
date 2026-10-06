'use client';

import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
} from 'react-aria-components';
import './Breadcrumbs.css';

export interface Crumb {
  /** Omitted on the current page, which is not a link. */
  readonly href?: string;
  readonly label: string;
}

export interface BreadcrumbsProps {
  readonly items: readonly Crumb[];
  /** Names the navigation landmark, so it is distinguishable from the main menu. */
  readonly label?: string;
}

/**
 * Breadcrumb trail (2.4.8 Location, AAA; 2.4.5 Multiple Ways, AA).
 *
 * The current page is a plain `<span aria-current="page">` rather than a `Link`. React
 * Aria marks the last item as current by disabling the link inside it, and a disabled
 * `Link` renders as `<span role="link" aria-disabled="true">`: a screen reader then
 * announces the page you are already on as a link you cannot use. The role overstates
 * the content, which is the second of the two accepted reasons for deviating in
 * design/component-inventory.md. The list and item structure still come from React Aria.
 */
export function Breadcrumbs({ items, label = 'Ścieżka nawigacyjna' }: BreadcrumbsProps) {
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={label} className="cp-breadcrumbs">
      <AriaBreadcrumbs className="cp-breadcrumbs__list">
        {items.map((item, index) => (
          <AriaBreadcrumb key={item.href ?? item.label} className="cp-breadcrumbs__item">
            {index === lastIndex || item.href === undefined ? (
              <span aria-current="page" className="cp-breadcrumbs__current">
                {item.label}
              </span>
            ) : (
              <AriaLink href={item.href} className="cp-breadcrumbs__link">
                {item.label}
              </AriaLink>
            )}
          </AriaBreadcrumb>
        ))}
      </AriaBreadcrumbs>
    </nav>
  );
}
