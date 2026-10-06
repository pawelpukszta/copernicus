/**
 * Locale primitives.
 *
 * Every human-readable string in a module's model is locale-keyed from the start,
 * even while Polish is the only locale that is written. Adding locale to the data model
 * is nearly free now and expensive once records exist; the routing layer arrives later.
 * See docs/adr/0008-internationalisation.md.
 */

/** Ukrainian is `uk`, the ISO 639-1 language code. `ua` is a country code. */
export const locales = ['pl', 'en', 'de', 'uk'] as const;

export type Locale = (typeof locales)[number];

/** The unprefixed locale: /wazne-telefony is Polish, /en/... carries a prefix. */
export const defaultLocale = 'pl' as const satisfies Locale;

export type DefaultLocale = typeof defaultLocale;

/**
 * A human-readable string in one or more locales. Polish is required because it is the
 * only locale committed for every record; the other three are filled in per translation
 * tier, so they are optional here rather than absent from the type.
 */
export type LocalizedText = { readonly [defaultLocale]: string } & {
  readonly [L in Exclude<Locale, DefaultLocale>]?: string;
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Reads one locale out of a localized string, falling back to Polish.
 *
 * The fallback is per string, not per page. A whole page that exists in Polish only is a
 * routing concern and states so in the requested language (ADR 0008, decision 2); a single
 * untranslated label inside an otherwise translated page is better shown in Polish than
 * blank, because it is usually a proper name.
 */
export function text(value: LocalizedText, locale: Locale = defaultLocale): string {
  return value[locale] ?? value[defaultLocale];
}

/** True when the string has been translated into the given locale. */
export function hasTranslation(value: LocalizedText, locale: Locale): boolean {
  return value[locale] !== undefined;
}
