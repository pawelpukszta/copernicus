import type { Phone } from '@/content';
import { contactCopy, formatPhoneNumber, telHref, text } from '@/content';
import './PhoneLink.css';

export interface PhoneLinkProps {
  readonly phone: Phone;
  /** `large` is the Pilne block and the mobile rows; `row` is a table cell. */
  readonly size?: 'large' | 'row';
}

/**
 * A number someone can dial.
 *
 * Deliberately not a client component: there is nothing to hydrate, and this is the one
 * element on the site that has to work when everything else fails. The visible text is the
 * accessible name, with no aria-label dressing it up as a sentence, so 2.5.3 Label in Name
 * holds and voice control can say what is on the screen.
 *
 * The display format is derived from the stored E.164 value, never authored: the current
 * site writes one number three ways.
 */
export function PhoneLink({ phone, size = 'row' }: PhoneLinkProps) {
  return (
    <a
      className={size === 'large' ? 'cp-phone cp-phone--large' : 'cp-phone'}
      href={telHref(phone.number, phone.extension)}
    >
      {formatPhoneNumber(phone.number)}
      {phone.extension ? (
        <span className="cp-phone__extension">
          {' '}
          {text(contactCopy.extensionLabel)} {phone.extension}
        </span>
      ) : null}
    </a>
  );
}

export interface PhoneListProps {
  readonly phones: readonly Phone[];
  readonly size?: 'large' | 'row';
}

/**
 * Up to four numbers, stacked, each its own 44 px target and each carrying its label when
 * the record gives it one ("odwołania zabiegów" is not the same number as "rejestracja").
 */
export function PhoneList({ phones, size = 'row' }: PhoneListProps) {
  return (
    <span className="cp-phone-list">
      {phones.map((phone) => (
        <span key={`${phone.number}-${phone.extension ?? ''}`} className="cp-phone-list__item">
          <PhoneLink phone={phone} size={size} />
          {phone.label ? <span className="cp-phone-list__label">{text(phone.label)}</span> : null}
        </span>
      ))}
    </span>
  );
}
