import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Note: @tauri-apps/plugin-shell is mocked via alias in vitest.config.ts
// pointing to src/test/mocks/tauri-shell.ts for consistent mock behavior
