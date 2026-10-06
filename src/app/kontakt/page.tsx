import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PhoneLink, formatAvailability, listFacilitySwitchboards } from '@/modules/contacts';
import { text } from '@/shared/i18n';
import '../info-page.css';

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Adresy i centrale pięciu placówek Copernicus Podmiot Leczniczy sp. z o.o. w Gdańsku.',
};

/**
 * Placeholder, on purpose and only until this route has its own screen spec.
 *
 * /kontakt is the institutional view of the same contact points /wazne-telefony renders:
 * addresses, how to get there, parking, building accessibility, role mailboxes, ePUAP,
 * NIP and KRS, the data protection officer, the complaints route. None of that is built
 * here, because a screen is implemented from design/screens/<route>.md and this route has
 * none yet.
 *
 * What it does do is stop the fallback action on /wazne-telefony from leading to a 404,
 * and it reads the switchboards from modules/contacts rather than repeating them, which is
 * the mistake the whole content model exists to prevent.
 */
export default async function ContactPage() {
  const switchboards = await listFacilitySwitchboards();

  return (
    <main id="main" className="cp-info" tabIndex={-1}>
      <Breadcrumbs items={[{ href: '/', label: 'Start' }, { label: 'Kontakt' }]} />

      <h1>Kontakt</h1>
      <p>
        Centrale wszystkich placówek. Każda łączy z oddziałami i poradniami. Jeśli szukasz
        konkretnego numeru, <a href="/wazne-telefony">ważne telefony</a> mają rejestracje i
        diagnostykę wypisane wprost.
      </p>

      <h2>Placówki</h2>
      <ul className="cp-info__facilities">
        {switchboards.map(({ facility, switchboard }) => (
          <li key={facility.id} className="cp-info__facility">
            <span className="cp-info__facility-name">{text(facility.name)}</span>
            <span className="cp-info__address">{text(facility.address)}</span>
            <PhoneLink phone={switchboard.phone} />{' '}
            <span className="cp-info__address">{formatAvailability(switchboard.availability)}</span>
          </li>
        ))}
      </ul>

      <h2>Czego tu jeszcze nie ma</h2>
      <p className="cp-info__pending">
        Dane rejestrowe, inspektor ochrony danych, ePUAP i e-Doręczenia, dojazd, parkingi oraz
        dostępność architektoniczna budynków pojawią się razem z projektem tej strony. Do tego czasu
        centrala połączy z właściwą komórką.
      </p>
    </main>
  );
}
