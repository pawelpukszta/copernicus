import { describe, expect, it } from 'vitest';
import {
  formatEmergencyShortCode,
  formatPhoneNumber,
  isE164,
  isEmergencyShortCode,
  isExtension,
  telHref,
} from './phone';

describe('formatPhoneNumber', () => {
  // The acceptance criterion from design/screens/wazne-telefony.md, and the reason the
  // formatter exists: the current site writes one number three ways.
  it('turns +48587640116 into 58 764 01 16', () => {
    expect(formatPhoneNumber('+48587640116')).toBe('58 764 01 16');
  });

  it('gives the three spellings on the current site one form', () => {
    // "58 76 40100", "58 764 01 00" and "58 76 40 200" are the same numbers written three
    // ways. Stored as E.164 they can only come out one way.
    expect(formatPhoneNumber('+48587640100')).toBe('58 764 01 00');
    expect(formatPhoneNumber('+48587640200')).toBe('58 764 02 00');
    expect(formatPhoneNumber('+48583005676')).toBe('58 300 56 76');
  });

  it('groups mobile numbers in threes, the way they are read aloud', () => {
    expect(formatPhoneNumber('+48605956682')).toBe('605 956 682');
    expect(formatPhoneNumber('+48691609691')).toBe('691 609 691');
  });

  it('refuses a value that is not E.164', () => {
    for (const notE164 of [
      '58 764 01 16',
      '587640116',
      '+48 587 640 116',
      '0048587640116',
      '112',
      'tel:+48587640116',
      '',
      '+',
      '+0587640116',
    ]) {
      expect(() => formatPhoneNumber(notE164)).toThrow(TypeError);
    }
  });

  it('keeps every digit of a number from outside Poland, and its plus', () => {
    const formatted = formatPhoneNumber('+493012345678');
    expect(formatted.startsWith('+')).toBe(true);
    expect(formatted.replace(/\D/g, '')).toBe('493012345678');
  });

  it('never loses a digit', () => {
    for (const number of ['+48587640116', '+48605956682', '+48587723950']) {
      expect(formatPhoneNumber(number).replace(/\D/g, '')).toBe(number.slice(3));
    }
  });
});

describe('isE164', () => {
  it('accepts a plus, a non-zero country code and up to fifteen digits', () => {
    expect(isE164('+48587640116')).toBe(true);
    expect(isE164('+1')).toBe(false);
    expect(isE164('+0587640116')).toBe(false);
    expect(isE164('+4858764011612345')).toBe(false);
  });
});

describe('telHref', () => {
  it('dials the stored number, not the displayed one', () => {
    expect(telHref('+48587640116')).toBe('tel:+48587640116');
  });

  it('passes an extension as an RFC 3966 parameter, so a plain dialler still connects', () => {
    expect(telHref('+48583005676', '101')).toBe('tel:+48583005676;ext=101');
  });

  it('dials an emergency short code as written', () => {
    expect(telHref('112')).toBe('tel:112');
  });

  it('refuses anything that is neither E.164 nor an emergency short code', () => {
    expect(() => telHref('58 764 01 16')).toThrow(TypeError);
    expect(() => telHref('911')).toThrow(TypeError);
  });

  it('refuses an extension that is not digits', () => {
    expect(() => telHref('+48583005676', 'wew. 101')).toThrow(TypeError);
  });
});

describe('emergency short codes', () => {
  it('knows the Polish ones and nothing else', () => {
    expect(isEmergencyShortCode('112')).toBe(true);
    expect(isEmergencyShortCode('999')).toBe(true);
    expect(isEmergencyShortCode('911')).toBe(false);
    expect(isEmergencyShortCode('+48112')).toBe(false);
  });

  it('displays a short code as written', () => {
    expect(formatEmergencyShortCode('112')).toBe('112');
  });
});

describe('isExtension', () => {
  it('accepts digits only', () => {
    expect(isExtension('101')).toBe(true);
    expect(isExtension('wew. 101')).toBe(false);
    expect(isExtension('')).toBe(false);
  });
});
