'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import './AccessibilityDemo.css';

/**
 * The only interactive block on the placeholder homepage. It is a client component
 * because React Aria needs the browser; everything around it is server-rendered.
 * Replace it with the real form once the screen spec exists.
 */
export function AccessibilityDemo() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section aria-labelledby="demo">
      <h2 id="demo">Komponenty</h2>
      <TextField
        label="Adres e-mail"
        type="email"
        autoComplete="email"
        description="Używamy go wyłącznie do potwierdzenia zgłoszenia."
        isRequired
      />
      <div className="cp-actions">
        <Button
          onPress={() => {
            setSubmitted(true);
          }}
        >
          Wyślij zgłoszenie
        </Button>
        <Button variant="secondary" onPress={() => setSubmitted(false)}>
          Wyczyść
        </Button>
      </div>

      {/* Status messages must be announced without moving focus (4.1.3). */}
      <p role="status" aria-live="polite" className="cp-status">
        {submitted ? 'Zgłoszenie zostało zapisane.' : ''}
      </p>
    </section>
  );
}
