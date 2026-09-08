import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SkipLink } from '@/components/SkipLink';
import { Providers } from '@/providers';
import '@/styles/global.css';

export const metadata: Metadata = {
  title: {
    default: 'Copernicus',
    template: '%s | Copernicus',
  },
  description: 'Serwis informacyjny Copernicus Podmiot Leczniczy sp. z o.o.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
