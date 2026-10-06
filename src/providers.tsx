'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider, RouterProvider } from 'react-aria-components';

/**
 * Wires React Aria's client-side navigation to the Next router, so `Link`,
 * `MenuItem href` and `Breadcrumb` navigate through the app instead of forcing a
 * full page load.
 *
 * This is one of only two places allowed to declare 'use client'; the other is
 * src/components. scripts/check-client-boundary.mjs enforces that.
 */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    /*
     * React Aria generates accessible names of its own: a search field's clear button,
     * a breadcrumb list's label. Without a declared locale it falls back to English, so
     * a Polish page would ship "Clear search" as the only name a screen reader reads out
     * (3.1.2 Language of Parts, and 2.4.6 Headings and Labels in spirit). The locale is
     * hard-coded to Polish until the [locale] segment exists, at which point it comes
     * from the route like <html lang> does.
     * See docs/adr/0008-internationalisation.md.
     */
    <I18nProvider locale="pl-PL">
      <RouterProvider navigate={(href) => router.push(href)}>{children}</RouterProvider>
    </I18nProvider>
  );
}
