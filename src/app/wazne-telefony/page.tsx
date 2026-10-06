import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/Button';
import { SearchField } from '@/components/SearchField';
import type { ContactFilter, ContactRow, ImportantPhonesGroup } from '@/modules/contacts';
import {
  PhoneLink,
  PhoneList,
  contactCopy,
  contactFilterHref,
  emergencyNumber,
  emergencyTelHref,
  formatAvailability,
  getImportantPhones,
  isAvailabilityUnknown,
} from '@/modules/contacts';
import type { Facility, FacilityRef } from '@/modules/facilities';
import { text } from '@/shared/i18n';
import { formatPhoneNumber } from '@/shared/lib/phone';
import './page.css';

export const metadata: Metadata = {
  title: 'Ważne telefony',
  description:
    'Numery telefonów Copernicus Podmiot Leczniczy: pogotowie, nocna i świąteczna opieka, rejestracje i diagnostyka w pięciu placówkach w Gdańsku.',
};

/**
 * The route the redesign starts with, because it serves the visitor the brief puts first:
 * someone who needs a phone number now.
 *
 * It replaces a page whose eleven groups were all collapsed, so it showed eleven headings
 * and no numbers, and the browser's own find function returned nothing. Two rules survive
 * from design/screens/wazne-telefony.md into every line below: nothing primary is behind a
 * disclosure, and urgent numbers come before everything else.
 *
 * Everything on this page is server-rendered. The filter is a plain GET form, so it works
 * with no JavaScript at all; correctness never depends on revalidation either, per rule 2
 * of docs/adr/0005-rendering-strategy-and-hosting.md.
 */
export default async function ImportantPhonesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { filter, filtered, found, urgent, groups, institutional, facilities } =
    await getImportantPhones(await searchParams);

  return (
    <>
      <EmergencyStrip />

      <main id="main" className="cp-phones" tabIndex={-1}>
        <Breadcrumbs items={[{ href: '/', label: 'Start' }, { label: 'Ważne telefony' }]} />

        <h1>Ważne telefony</h1>
        <p className="cp-phones__lead">
          Numery są widoczne od razu, bez rozwijania. Wszystkie działają jako odnośniki: na
          telefonie wystarczy je dotknąć, żeby zadzwonić.
        </p>

        <UrgentBlock rows={urgent} />

        <FilterForm filter={filter} filtered={filtered} facilities={facilities} />

        {filtered ? (
          <p className="cp-phones__count" role="status">
            {found === 0
              ? `Nie znaleziono numeru dla zapytania „${filter.q ?? ''}”.`
              : `Znaleziono ${found} ${numeralsOf(found)}.`}
          </p>
        ) : null}

        {found === 0 && filtered ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {groups.map((group) => (
              <FacilitySection key={group.facility.id} group={group} />
            ))}

            {institutional.length > 0 ? (
              <section aria-labelledby="instytucje" className="cp-group">
                <h2 id="instytucje">Dla mediów i instytucji</h2>
                <ContactTable caption="Kontakty dla mediów i instytucji" rows={institutional} />
              </section>
            ) : null}
          </>
        )}

        <FallbackCard />
      </main>

      <footer className="cp-phones__footer">
        <p>
          Dane kontaktowe sprawdzono 8 września 2026. Zauważyłeś nieaktualny numer?{' '}
          <a href="mailto:dostepnosc@example.org">Napisz do nas</a>.
        </p>
      </footer>
    </>
  );
}

/** Polish needs three forms of the noun; getting it wrong reads as machine output. */
function numeralsOf(count: number): string {
  if (count === 1) return 'numer';
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo < 12 || lastTwo > 14) {
    if (last >= 2 && last <= 4) return 'numery';
  }
  return 'numerów';
}

/**
 * Permanent content, not a `role="alert"`: an alert would be announced on every page load,
 * which trains people to ignore it. It belongs to the site chrome and moves into the
 * layout when the header iteration lands.
 */
function EmergencyStrip() {
  return (
    <div className="cp-emergency">
      <p className="cp-emergency__text">
        Zagrożenie życia? Zadzwoń{' '}
        <a className="cp-emergency__number" href={emergencyTelHref(emergencyNumber.code)}>
          {emergencyNumber.code}
        </a>
      </p>
    </div>
  );
}

function UrgentBlock({ rows }: { rows: readonly ContactRow[] }) {
  return (
    <section aria-labelledby="pilne" className="cp-urgent">
      <h2 id="pilne">Pilne</h2>
      <ul className="cp-urgent__grid">
        <li className="cp-urgent__card">
          <span className="cp-urgent__label">{text(emergencyNumber.label)}</span>
          <a className="cp-phone cp-phone--large" href={emergencyTelHref(emergencyNumber.code)}>
            {emergencyNumber.code}
          </a>
          {emergencyNumber.note ? (
            <span className="cp-urgent__note">{text(emergencyNumber.note)}</span>
          ) : null}
        </li>

        {rows.map(({ contactPoint: record, phones: resolved }) => {
          return (
            <li key={record.id} className="cp-urgent__card">
              <span className="cp-urgent__label">{text(record.label)}</span>
              <PhoneList phones={resolved.phones} size="large" />
              {resolved.kind === 'fallback' ? <FallbackNote facility={resolved.facility} /> : null}
              <span className="cp-urgent__note">
                {formatAvailability(
                  resolved.kind === 'fallback' ? resolved.availability : record.availability,
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A plain GET form. Submitting it reloads the route with ?q= and ?placowka=, and the
 * server returns the filtered list, so the filter works with JavaScript disabled. The
 * client-side enhancement described in the spec is deliberately not built yet: the
 * enhanced path may not show anything different from the server path, and the surest way
 * to keep that true is to have one path.
 */
function FilterForm({
  filter,
  filtered,
  facilities,
}: {
  filter: ContactFilter;
  filtered: boolean;
  facilities: readonly Facility[];
}) {
  return (
    <form method="get" action="/wazne-telefony" className="cp-filter">
      <div className="cp-filter__field">
        <SearchField
          label="Szukaj numeru"
          name="q"
          defaultValue={filter.q ?? ''}
          description="Nazwa oddziału, placówka lub fragment numeru"
        />
      </div>

      <div className="cp-filter__field">
        {/*
         * Native select, not React Aria's. Before hydration `Select` renders a dead button
         * next to an aria-hidden, tabindex="-1" native select: the visible control does
         * nothing and the working one is out of reach of both the keyboard and assistive
         * technology. The evidence is in design/screens/wazne-telefony.md.
         */}
        <label className="cp-filter__label" htmlFor="placowka">
          Placówka
        </label>
        <select
          className="cp-filter__select"
          id="placowka"
          name="placowka"
          defaultValue={filter.facility ?? ''}
        >
          <option value="">Wszystkie placówki</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {text(facility.name)}
            </option>
          ))}
        </select>
      </div>

      <div className="cp-filter__actions">
        <Button type="submit" variant="primary">
          Filtruj
        </Button>
        {filtered ? (
          <a className="cp-filter__reset" href="/wazne-telefony">
            Wyczyść filtr
          </a>
        ) : null}
      </div>

      {/*
       * Sorting is a server-rendered link, like the spec asks, but it sits here rather
       * than in the column headers: below 640 px the header row is replaced by stacked
       * rows, and a control that disappears with the viewport is worse than one that
       * moves. The sort keeps whatever filter is already set.
       */}
      <p className="cp-filter__sort">
        Kolejność:{' '}
        {filter.sort === 'label' ? (
          <>
            <a href={contactFilterHref(filter, { sort: 'order' })}>redakcyjna</a>
            <span aria-current="true"> alfabetyczna</span>
          </>
        ) : (
          <>
            <span aria-current="true">redakcyjna </span>
            <a href={contactFilterHref(filter, { sort: 'label' })}>alfabetyczna</a>
          </>
        )}
      </p>
    </form>
  );
}

function FacilitySection({ group }: { group: ImportantPhonesGroup }) {
  const headingId = `placowka-${group.facility.id}`;
  const { facility, switchboard } = group;

  return (
    <section aria-labelledby={headingId} className="cp-group">
      <h2 id={headingId}>{text(facility.name)}</h2>

      <p className="cp-group__meta">
        {text(facility.address)}
        <span className="cp-group__separator" aria-hidden="true">
          {' · '}
        </span>
        Centrala: <PhoneLink phone={switchboard.phone} />
        <span className="cp-group__hours"> {formatAvailability(switchboard.availability)}</span>
      </p>

      {group.rows.length > 0 ? (
        <ContactTable caption={`Telefony: ${text(facility.name)}`} rows={group.rows} />
      ) : (
        <p className="cp-group__empty">
          Pozostałe numery tej placówki są w jej własnej zakładce kontaktowej.
        </p>
      )}

      {group.hasMore ? (
        <p>
          <a href={`/szpitale/${facility.slug}#kontakt`}>
            Wszystkie numery: {text(facility.name)} ({group.total})
          </a>
        </p>
      ) : null}
    </section>
  );
}

/**
 * A plain table, not React Aria's `Table`. `Table` renders `role="grid"`, an interactive
 * two-dimensional widget that puts screen readers into grid navigation; this route has no
 * selection and no client-side sorting, so plain table semantics describe it accurately.
 * Below 640 px the CSS stacks each row, which is the mobile pattern from the artboard.
 */
function ContactTable({ caption, rows }: { caption: string; rows: readonly ContactRow[] }) {
  return (
    <div className="cp-table__scroll">
      <table className="cp-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Nazwa</th>
            <th scope="col">Numer</th>
            <th scope="col">Dostępność</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ contactPoint: record, phones: resolved }) => {
            const availability =
              resolved.kind === 'fallback' ? resolved.availability : record.availability;

            return (
              <tr key={record.id}>
                <th scope="row" className="cp-table__label">
                  {text(record.label)}
                  {record.note ? <span className="cp-table__note">{text(record.note)}</span> : null}
                </th>
                <td className="cp-table__numbers">
                  <PhoneList phones={resolved.phones} size="row" />
                  {resolved.kind === 'fallback' ? (
                    <FallbackNote facility={resolved.facility} />
                  ) : null}
                  {record.fax ? (
                    /* Never a tel: link. A fax is not something to call. */
                    <span className="cp-table__fax">
                      {text(contactCopy.faxLabel)} {formatPhoneNumber(record.fax)}
                    </span>
                  ) : null}
                </td>
                <td
                  className={
                    isAvailabilityUnknown(availability)
                      ? 'cp-table__hours cp-table__hours--unknown'
                      : 'cp-table__hours'
                  }
                >
                  {formatAvailability(availability)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Says out loud that the number above is the switchboard standing in for one that does not
 * exist yet. Hiding the row would conceal from the patient that the unit exists; showing
 * "numer w przygotowaniu" alone would leave them with no way to reach anyone.
 */
function FallbackNote({ facility }: { facility: FacilityRef }) {
  return (
    <span className="cp-fallback-note">
      {text(contactCopy.numberInPreparation)}, {text(contactCopy.temporarilySwitchboard)}{' '}
      {text(facility.name)}
    </span>
  );
}

function EmptyState({ filter }: { filter: ContactFilter }) {
  return (
    <section aria-labelledby="brak-wynikow" className="cp-empty">
      <h2 id="brak-wynikow">Nie znaleziono numeru dla „{filter.q ?? ''}”</h2>
      <p>
        Pilne numery powyżej pozostają aktualne. Możesz też wyczyścić filtr albo zadzwonić na
        centralę wybranej placówki.
      </p>
      <p className="cp-empty__actions">
        <a className="cp-action" href="/wazne-telefony">
          Wyczyść filtr
        </a>
        <a className="cp-action" href="/kontakt">
          Wszystkie dane kontaktowe
        </a>
      </p>
    </section>
  );
}

function FallbackCard() {
  return (
    <section aria-labelledby="nie-znalazles" className="cp-fallback-card">
      <h2 id="nie-znalazles">Nie znalazłeś numeru?</h2>
      <p>
        Centrale placówek łączą z każdym oddziałem i poradnią. Jeśli ta strona nie działa dla Ciebie
        tak, jak powinna, napisz — to traktujemy jak błąd.
      </p>
      <p className="cp-fallback-card__actions">
        <a className="cp-action" href="/kontakt">
          Wszystkie dane kontaktowe
        </a>
        <a className="cp-action" href="/zglos-problem-dostepnosci">
          Zgłoś problem z dostępnością
        </a>
      </p>
    </section>
  );
}
