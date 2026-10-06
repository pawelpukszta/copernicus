import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PhoneLink, PhoneList } from './PhoneLink';

/**
 * What a phone number renders as on the server, which is all it ever renders as: PhoneLink
 * is not a client component, because the one element on the site that has to work when
 * everything else fails must not wait for hydration.
 */
describe('phone numbers before hydration', () => {
  it('are dialable links whose visible text is their accessible name (2.5.3)', () => {
    const markup = renderToStaticMarkup(
      <PhoneLink phone={{ number: '+48587640116' }} size="large" />,
    );

    expect(markup).toContain('href="tel:+48587640116"');
    expect(markup).toContain('58 764 01 16');
    // No aria-label: the visible text is the name, so voice control can say it.
    expect(markup).not.toContain('aria-label');
  });

  it('carry an extension in the href as well as on screen', () => {
    const markup = renderToStaticMarkup(
      <PhoneLink phone={{ number: '+48583005676', extension: '101' }} />,
    );

    expect(markup).toContain('href="tel:+48583005676;ext=101"');
    expect(markup).toContain('wew. 101');
  });

  it('render every number of a multi-number row as its own link', () => {
    const markup = renderToStaticMarkup(
      <PhoneList phones={[{ number: '+48587640200' }, { number: '+48587640300' }]} />,
    );

    expect(markup.match(/href="tel:/g)).toHaveLength(2);
  });
});
