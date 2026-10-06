'use client';

import { Button, Input, Label, SearchField as AriaSearchField, Text } from 'react-aria-components';
import type { SearchFieldProps as AriaSearchFieldProps } from 'react-aria-components';
import './SearchField.css';

export interface SearchFieldProps extends AriaSearchFieldProps {
  /** Always visible. A placeholder is not a label (3.3.2 Labels or Instructions). */
  label: string;
  /** Persistent help text, announced through aria-describedby. */
  description?: string;
}

/**
 * Search input for a form that is submitted to the server.
 *
 * React Aria is used here, unlike the facility select beside it, because its
 * pre-hydration DOM is a real `<input type="search">` carrying its `name`: it is typeable
 * and it submits with the form before any JavaScript runs. Only the clear button is inert
 * until hydration, and that is a nicety, not the task. The evidence is asserted in
 * src/components/ssr-degradation.test.tsx so an upgrade of the library cannot quietly
 * change it.
 */
export function SearchField({ label, description, ...props }: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className="cp-search">
      <Label className="cp-search__label">{label}</Label>
      <div className="cp-search__control">
        <Input className="cp-search__input" />
        <Button className="cp-search__clear">
          {/* The accessible name comes from React Aria, in Polish via I18nProvider.
              The glyph is decoration and must not be read out on top of it. */}
          <span aria-hidden="true">✕</span>
        </Button>
      </div>
      {description ? (
        <Text slot="description" className="cp-search__description">
          {description}
        </Text>
      ) : null}
    </AriaSearchField>
  );
}
