import type { Metadata } from 'next';
import { AccessibilityDemo } from '@/components/AccessibilityDemo';
import { PhoneLink, listFacilitySwitchboards } from '@/modules/contacts';
import { text } from '@/shared/i18n';
import './page.css';

export const metadata: Metadata = {
  title: 'Start',
};

/**
 * Placeholder homepage. It exists to prove the baseline rather than to be the
 * design: the contact numbers below are rendered on the server, so they are
 * readable before hydration and with JavaScript disabled, which is what
 * e2e/server-rendered.spec.ts asserts. Replace once design/screens/ has a spec.
 */
export default async function HomePage() {
  const switchboards = await listFacilitySwitchboards();

  return (
    <>
      <header className="cp-header">
        <nav aria-label="Nawigacja główna">
          <ul className="cp-nav">
            <li>
              <a href="#main">Start</a>
            </li>
            <li>
              <a href="#dostepnosc">Dostępność</a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main" className="cp-main" tabIndex={-1}>
        <h1>Copernicus</h1>
        <p>
          Fundament nowego serwisu: komponenty React Aria, tokeny kolorystyczne z budżetem kontrastu
          weryfikowanym automatycznie oraz testy dostępności uruchamiane w CI. Serwis celuje w
          zgodność z WCAG 2.2 na poziomie AA.
        </p>

        <section aria-labelledby="kontakt">
          <h2 id="kontakt">Centrale placówek</h2>
          {/*
           * Server-rendered on purpose: this must work without JavaScript. Read from
           * modules/contacts rather than typed out here, because a number that exists in two
           * places drifts: /wazne-telefony and /kontakt disagreed on the current site
           * until one of them was publishing a fax as the number to call.
           */}
          <ul className="cp-contact">
            {switchboards.map(({ facility, switchboard }) => (
              <li key={facility.id}>
                {text(facility.name)}, {text(facility.address)}:{' '}
                <PhoneLink phone={switchboard.phone} />
              </li>
            ))}
          </ul>
          <p>
            Rejestracje, diagnostyka i numery pilne: <a href="/wazne-telefony">ważne telefony</a>.
          </p>
        </section>

        <section aria-labelledby="dostepnosc">
          <h2 id="dostepnosc">Baseline dostępności</h2>
          <ul>
            <li>Pełna obsługa klawiatury i widoczny wskaźnik fokusu.</li>
            <li>Minimalny obszar klikalny 44 x 44 px, powyżej wymagań poziomu AA.</li>
            <li>Kontrast tekstu 7:1, powyżej wymagań poziomu AA.</li>
            <li>Tekst skalowalny do 200% bez utraty treści.</li>
            <li>Obsługa trybu wysokiego kontrastu i redukcji animacji.</li>
          </ul>
        </section>

        <AccessibilityDemo />
      </main>

      <footer className="cp-footer">
        <p>
          Masz problem z dostępnością tego serwisu?{' '}
          <a href="/zglos-problem-dostepnosci">Zgłoś go</a>.
        </p>
      </footer>
    </>
  );
}
