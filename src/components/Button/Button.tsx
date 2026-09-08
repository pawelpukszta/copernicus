import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { ButtonProps as AriaButtonProps } from 'react-aria-components';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<AriaButtonProps, 'children'> {
  variant?: ButtonVariant;
  /**
   * Visible label. Prefer this over aria-label: 2.5.3 Label in Name (AA) requires the
   * accessible name to contain the visible text.
   */
  children: ReactNode;
}

/**
 * Accessible button built on React Aria Components.
 *
 * Guarantees:
 * - 44x44 px minimum hit area, which clears 2.5.8 (AA, 24px) and 2.5.5 (AAA, 44px)
 * - token-based focus indicator, meeting 2.4.7 (AA) and 2.4.13 (AAA)
 * - hover/press/focus/disabled states exposed as data attributes by React Aria,
 *   so styling never depends on CSS pseudo-classes that assistive tech cannot see
 */
export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={(renderProps) =>
        [
          'cp-button',
          `cp-button--${variant}`,
          typeof className === 'function' ? className(renderProps) : className,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {children}
    </AriaButton>
  );
}
