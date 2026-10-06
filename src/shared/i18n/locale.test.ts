import { describe, expect, it } from 'vitest';
import { defaultLocale, hasTranslation, isLocale, locales, text } from './locale';

describe('locales', () => {
  it('uses uk for Ukrainian, because ua is a country code', () => {
    expect(locales).toContain('uk');
    expect(locales).not.toContain('ua');
    expect(isLocale('ua')).toBe(false);
  });

  it('leaves Polish unprefixed, as the route shape assumes', () => {
    expect(defaultLocale).toBe('pl');
  });
});

describe('text', () => {
  it('reads the requested locale', () => {
    expect(text({ pl: 'Rejestracja', en: 'Registration' }, 'en')).toBe('Registration');
  });

  it('falls back to Polish for a string that is not translated yet', () => {
    expect(text({ pl: 'Rejestracja' }, 'de')).toBe('Rejestracja');
  });

  it('defaults to Polish when no locale is given', () => {
    expect(text({ pl: 'Rejestracja' })).toBe('Rejestracja');
  });

  it('can tell a fallback from a translation, so a page can say which it is showing', () => {
    const label = { pl: 'Rejestracja', en: 'Registration' };
    expect(hasTranslation(label, 'en')).toBe(true);
    expect(hasTranslation(label, 'uk')).toBe(false);
  });
});
