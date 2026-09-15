/**
 * The content layer. Routes read from here until a CMS is chosen, and this module is the
 * contract that CMS will have to satisfy.
 */
export type {
  Availability,
  AvailabilityException,
  ContactAudience,
  ContactCategory,
  ContactPoint,
  DayRange,
  EmergencyContact,
  Facility,
  FacilityId,
  FacilityRef,
  Phone,
  UnitRef,
  Weekday,
} from './contact-point';
export {
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PHONES_PER_CONTACT_POINT,
  MAX_PHONE_NOTE_LENGTH,
  MIN_LABEL_LENGTH,
  contactAudiences,
  contactCategories,
} from './contact-point';

export type { Locale, LocalizedText } from './locale';
export { defaultLocale, hasTranslation, isLocale, locales, text } from './locale';

export type { EmergencyShortCode } from './phone';
export {
  emergencyShortCodes,
  formatEmergencyShortCode,
  formatPhoneNumber,
  isE164,
  isEmergencyShortCode,
  isExtension,
  telHref,
} from './phone';

export { facilities, facilityOrder, facilityRef, getFacility } from './facilities';
export { contactPoints, emergencyNumber } from './contact-points';

export type { ResolvedPhones } from './fallback';
export { isFallback, resolvePhones } from './fallback';

export { contactCopy } from './copy';

export type { IssueSeverity, ValidationContext, ValidationIssue } from './validation';
export {
  assertValidContactPoints,
  contentGaps,
  errorsOnly,
  isRoleMailbox,
  isShoutingCaps,
  validateContactPoint,
  validateContactPoints,
} from './validation';
