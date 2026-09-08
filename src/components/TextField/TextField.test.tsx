import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from './TextField';

describe('TextField', () => {
  it('wires a permanently visible label to the input (3.3.2 Labels or Instructions)', () => {
    render(<TextField label="Numer telefonu" />);
    expect(screen.getByLabelText('Numer telefonu')).toBeDefined();
  });

  it('announces the description through aria-describedby (3.3.5 Help)', () => {
    render(<TextField label="PESEL" description="11 cyfr, bez spacji." />);
    const input = screen.getByLabelText('PESEL');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(screen.getByText('11 cyfr, bez spacji.')).toBeDefined();
  });

  it('accepts typed input from the keyboard', async () => {
    const user = userEvent.setup();
    render(<TextField label="Imie" />);
    const input = screen.getByLabelText('Imie');
    await user.click(input);
    await user.keyboard('Pawel');
    expect((input as HTMLInputElement).value).toBe('Pawel');
  });
});
