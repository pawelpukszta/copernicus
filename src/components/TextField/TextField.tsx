import { FieldError, Input, Label, Text, TextField as AriaTextField } from 'react-aria-components';
import type { TextFieldProps as AriaTextFieldProps, ValidationResult } from 'react-aria-components';
import type { ReactNode } from 'react';
import './TextField.css';

export interface TextFieldProps extends AriaTextFieldProps {
  /** Always visible. A placeholder is not a label (3.3.2 Labels or Instructions). */
  label: string;
  /** Persistent help text, announced via aria-describedby. */
  description?: string;
  /** Error message or a function receiving the validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  children?: ReactNode;
}

/**
 * Accessible single-line text input.
 *
 * Guarantees:
 * - permanently visible label wired to the input (3.3.2, A)
 * - description and error announced through aria-describedby / aria-errormessage (3.3.1, A)
 * - autocomplete tokens supported so 1.3.5 Identify Input Purpose (AA) can be satisfied
 * - errors are text, never colour alone (1.4.1 Use of Colour, A)
 */
export function TextField({
  label,
  description,
  errorMessage,
  children,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField {...props} className="cp-field">
      <Label className="cp-field__label">{label}</Label>
      <Input className="cp-field__input" />
      {description ? (
        <Text slot="description" className="cp-field__description">
          {description}
        </Text>
      ) : null}
      <FieldError className="cp-field__error">{errorMessage}</FieldError>
      {children}
    </AriaTextField>
  );
}
