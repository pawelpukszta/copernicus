import { describe, expect, it } from 'vitest';
import {
  emergencyNumber,
  emergencyTelHref,
  formatEmergencyShortCode,
  isEmergencyShortCode,
} from './emergency';

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

  it('dials a short code as written', () => {
    expect(emergencyTelHref('112')).toBe('tel:112');
  });
});

describe('the emergency number', () => {
  it('is a constant, not a record an editor can retype', () => {
    expect(emergencyNumber.code).toBe('112');
    expect(emergencyTelHref(emergencyNumber.code)).toBe('tel:112');
  });
});
