import '@testing-library/react';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Aria relies on matchMedia for responsive and reduced-motion behaviour.
// jsdom does not implement it, so provide a minimal stub.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  cleanup();
});
