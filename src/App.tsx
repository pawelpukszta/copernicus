import { useState } from 'react';
import { Button } from './components/Button';
import { SkipLink } from './components/SkipLink';
import { TextField } from './components/TextField';
import './App.css';

/**
 * Landing shell for the redesign. It exists to prove the accessibility baseline:
 * one skip link, a single h1, real landmarks, and components wired to tokens.
 * Replace the content as soon as the information architecture is agreed.
 */
export function App() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <SkipLink />

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

        <section aria-labelledby="demo">
          <h2 id="demo">Komponenty</h2>
          <TextField
            label="Adres e-mail"
            type="email"
            autoComplete="email"
            description="Używamy go wyłącznie do potwierdzenia zgłoszenia."
            isRequired
          />
          <div className="cp-actions">
            <Button
              onPress={() => {
                setSubmitted(true);
              }}
            >
              Wyślij zgłoszenie
            </Button>
            <Button variant="secondary" onPress={() => setSubmitted(false)}>
              Wyczyść
            </Button>
          </div>

          {/* Status messages must be announced without moving focus (4.1.3). */}
          <p role="status" aria-live="polite" className="cp-status">
            {submitted ? 'Zgłoszenie zostało zapisane.' : ''}
          </p>
        </section>
      </main>

      <footer className="cp-footer">
        <p>
          Masz problem z dostępnością tego serwisu?{' '}
          <a href="mailto:dostepnosc@example.org">Napisz do nas</a>.
        </p>
      </footer>
    </>
  );
}
