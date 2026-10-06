// model
export type { Availability, AvailabilityException, DayRange, Weekday } from './model/availability';
export {
  formatAvailability,
  formatDayRange,
  formatDays,
  isAvailabilityUnknown,
} from './model/availability';
export type {
  ContactAudience,
  ContactCategory,
  ContactPoint,
  Phone,
  UnitRef,
} from './model/contact-point';
export {
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PHONES_PER_CONTACT_POINT,
  MAX_PHONE_NOTE_LENGTH,
  MIN_LABEL_LENGTH,
  contactAudiences,
  contactCategories,
} from './model/contact-point';
export type { EmergencyContact, EmergencyShortCode } from './model/emergency';
export {
  emergencyNumber,
  emergencyShortCodes,
  emergencyTelHref,
  formatEmergencyShortCode,
  isEmergencyShortCode,
} from './model/emergency';
export type { Switchboard } from './model/switchboard';
export type { IssueSeverity, ValidationContext, ValidationIssue } from './model/validation';
export {
  assertValidContactPoints,
  contentGaps,
  errorsOnly,
  isRoleMailbox,
  isShoutingCaps,
  validateContactPoint,
  validateContactPoints,
} from './model/validation';

// queries
export type { ContactFilter, SortKey } from './queries/contact-filter';
export { contactFilterHref } from './queries/contact-filter';
export { getSwitchboard } from './queries/get-switchboard';
export type { ContactRow, ImportantPhones, ImportantPhonesGroup } from './queries/important-phones';
export { getImportantPhones } from './queries/important-phones';
export type { FacilitySwitchboard } from './queries/list-facility-switchboards';
export { listFacilitySwitchboards } from './queries/list-facility-switchboards';
export type { ResolvedPhones } from './queries/resolve-phones';

// ui
export type { PhoneLinkProps, PhoneListProps } from './ui/PhoneLink';
export { PhoneLink, PhoneList } from './ui/PhoneLink';

// copy
export { contactCopy } from './copy';
