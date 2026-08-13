import { vi } from 'vitest';

// Mock Bootstrap so it doesn’t touch `document` at import time
vi.mock('bootstrap/dist/js/bootstrap.js', () => ({}));
vi.mock('bootstrap', () => ({}));

// (Optional) common polyfills your code might expect
if (!window.matchMedia) {
  // very lightweight stub
  window.matchMedia = (() => ({
    matches: false,
    addListener: () => {
      // Stub implementation for addListener
    },
    removeListener: () => {
      // Stub implementation for removeListener
    },
    addEventListener: () => {
      // Stub implementation for addEventListener
    },
    removeEventListener: () => {
      // Stub implementation for removeEventListener
    },
    dispatchEvent: () => false,
    media: '',
    onchange: null,
  })) as typeof window.matchMedia;
}
