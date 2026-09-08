import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('exposes the visible label as its accessible name (2.5.3 Label in Name)', () => {
    render(<Button>Zapisz zmiany</Button>);
    expect(screen.getByRole('button', { name: 'Zapisz zmiany' })).toBeDefined();
  });

  it('is operable with the keyboard alone (2.1.1 Keyboard)', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Button onPress={onPress}>Wyslij</Button>);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button'));

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('marks the disabled state without removing the element from the a11y tree', () => {
    render(<Button isDisabled>Niedostepne</Button>);
    const button = screen.getByRole('button', { name: 'Niedostepne' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('data-disabled')).not.toBeNull();
  });
});
