import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import type { ReactElement } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { PhoneLink, PhoneList } from './PhoneLink';
import { SearchField } from './SearchField';
import { Button } from './Button';

/**
 * What the wrappers on /wazne-telefony render *before hydration*.
 *
 * design/screens/wazne-telefony.md decides which React Aria components to use from their
 * real server-rendered DOM rather than from an argument about JavaScript. This file is
 * what keeps that decision honest when the library is upgraded: if React Aria changes what
 * `SearchField` emits, this fails here instead of on the live site.
 *
 * Rendered the way the app renders it, inside I18nProvider, because the accessible names
 * React Aria generates are part of what is being asserted.
 */
function ssr(element: ReactElement): string {
  return renderToStaticMarkup(<I18nProvider locale="pl-PL">{element}</I18nProvider>);
}

describe('SearchField before hydration', () => {
  const markup = ssr(<SearchField label="Szukaj numeru" name="q" defaultValue="" />);

  it('is a real search input carrying its name, so the form submits without JavaScript', () => {
    expect(markup).toContain('type="search"');
    expect(markup).toContain('name="q"');
  });

  it('has a label wired to the input, not a placeholder standing in for one', () => {
    const idMatch = /<input[^>]*\bid="([^"]+)"/.exec(markup);
    expect(idMatch).not.toBeNull();
    expect(markup).toContain(`for="${idMatch?.[1] ?? ''}"`);
    expect(markup).toContain('Szukaj numeru');
    expect(markup).not.toContain('placeholder=');
  });

  it('names its clear button in Polish, because React Aria would otherwise say "Clear search"', () => {
    // The button itself is inert until hydration. That is a nicety, not the task: the
    // input types and submits regardless. A working clear is offered as a plain link.
    expect(markup).toContain('Wyczyść');
    expect(markup).not.toContain('Clear search');
  });
});

describe('Breadcrumbs before hydration', () => {
  const markup = ssr(
    <Breadcrumbs items={[{ href: '/', label: 'Start' }, { label: 'Ważne telefony' }]} />,
  );

  it('links every ancestor', () => {
    expect(markup).toContain('href="/"');
    expect(markup).toContain('Start');
  });

  it('marks the current page without announcing it as a link you cannot use', () => {
    expect(markup).toContain('aria-current="page"');
    // React Aria's own current breadcrumb is a disabled Link, which renders as
    // <span role="link" aria-disabled="true">. That is the role overstating the content.
    expect(markup).not.toContain('role="link"');
    expect(markup).not.toContain('aria-disabled="true"');
  });

  it('is a navigation landmark with a name of its own', () => {
    expect(markup).toMatch(/<nav[^>]*aria-label="[^"]+"/);
  });
});

describe('phone numbers before hydration', () => {
  it('are dialable links whose visible text is their accessible name (2.5.3)', () => {
    const markup = ssr(<PhoneLink phone={{ number: '+48587640116' }} size="large" />);

    expect(markup).toContain('href="tel:+48587640116"');
    expect(markup).toContain('58 764 01 16');
    // No aria-label: the visible text is the name, so voice control can say it.
    expect(markup).not.toContain('aria-label');
  });

  it('carry an extension in the href as well as on screen', () => {
    const markup = ssr(<PhoneLink phone={{ number: '+48583005676', extension: '101' }} />);

    expect(markup).toContain('href="tel:+48583005676;ext=101"');
    expect(markup).toContain('wew. 101');
  });

  it('render every number of a multi-number row as its own link', () => {
    const markup = ssr(
      <PhoneList phones={[{ number: '+48587640200' }, { number: '+48587640300' }]} />,
    );

    expect(markup.match(/href="tel:/g)).toHaveLength(2);
  });
});

describe('the filter button before hydration', () => {
  it('is a real submit button, so the form works without JavaScript', () => {
    const markup = ssr(
      <Button type="submit" variant="primary">
        Filtruj
      </Button>,
    );

    expect(markup).toContain('type="submit"');
    expect(markup).toContain('Filtruj');
  });
});
