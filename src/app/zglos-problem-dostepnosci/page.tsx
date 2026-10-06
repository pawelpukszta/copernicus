import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PhoneLink, getSwitchboard } from '@/modules/contacts';
import '../info-page.css';

export const metadata: Metadata = {
  title: 'Zgłoś problem z dostępnością',
  description:
    'Jak zgłosić barierę w serwisie Copernicus: adres e-mail, telefon, czego potrzebujemy w zgłoszeniu i co dzieje się dalej.',
};

/**
 * Placeholder until this route has a screen spec and a POST handler.
 *
 * design/information-architecture.md gives it a form whose submission is handled on the
 * server. A form without that handler would be a control that looks operable and does
 * nothing, which on an accessibility feedback page would be its own small insult. So the
 * channels are here as working links, and the form arrives with its spec.
 */
export default async function AccessibilityFeedbackPage() {
  const kopernik = await getSwitchboard('kopernik');

  return (
    <main id="main" className="cp-info" tabIndex={-1}>
      <Breadcrumbs
        items={[{ href: '/', label: 'Start' }, { label: 'Zgłoś problem z dostępnością' }]}
      />

      <h1>Zgłoś problem z dostępnością</h1>
      <p>
        Jeśli cokolwiek w tym serwisie jest dla Ciebie nie do użycia, traktujemy to jak błąd, a nie
        jak prośbę o udogodnienie. Zgłoszenie możesz wysłać e-mailem albo przekazać telefonicznie —
        obie drogi trafiają w to samo miejsce.
      </p>

      <h2>Jak się z nami skontaktować</h2>
      <ul>
        <li>
          E-mail: <a href="mailto:dostepnosc@example.org">dostepnosc@example.org</a>
        </li>
        <li>
          Telefon: <PhoneLink phone={kopernik.phone} /> (centrala, poproś o kontakt w sprawie
          dostępności serwisu)
        </li>
      </ul>

      <h2>Co warto napisać</h2>
      <p>Im więcej z tego podasz, tym szybciej odtworzymy problem. Nic nie jest obowiązkowe.</p>
      <ul>
        <li>Adres strony, na której wystąpił problem.</li>
        <li>Co chciałeś zrobić i co się zamiast tego stało.</li>
        <li>
          Czego używasz: przeglądarka, czytnik ekranu, powiększenie, tryb wysokiego kontrastu.
        </li>
        <li>Jak możemy się odezwać z odpowiedzią.</li>
      </ul>

      <h2>Co dzieje się dalej</h2>
      <p>
        Odpowiadamy na zgłoszenie i mówimy wprost, czy i kiedy barierę usuniemy. Jeśli odpowiedź Cię
        nie satysfakcjonuje, możesz skierować sprawę do organu nadzorującego — droga odwoławcza
        będzie opisana w deklaracji dostępności.
      </p>
      <p className="cp-info__pending">
        Formularz zgłoszeniowy oraz deklaracja dostępności powstaną w kolejnym kroku. Adres e-mail
        powyżej jest adresem zastępczym na czas prac nad prototypem.
      </p>
    </main>
  );
}
