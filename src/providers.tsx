'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RouterProvider } from 'react-aria-components';

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

  return <RouterProvider navigate={(href) => router.push(href)}>{children}</RouterProvider>;
}
