/**
 * Test configuration for astro-gravatar package
 * Sets up global test environment and mocks
 */

import { beforeAll, afterEach, afterAll } from 'bun:test';

// Global test configuration
beforeAll(() => {
  // Set up test environment variables
  process.env['NODE_ENV'] = 'test';
  process.env['GRAVATAR_TEST_MODE'] = 'true';

  // Mock console methods in tests to reduce noise
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: jest.fn(),
    // Uncomment to suppress console.warn in tests
    // warn: jest.fn(),
    // Uncomment to suppress console.error in tests
    // error: jest.fn(),
  };
});

// Clean up after each test
afterEach(() => {
  // Reset any global state between tests
  // Clear any modules that might have been cached
  if ((globalThis as any).mockFetch) {
    (globalThis as any).mockFetch = undefined;
  }
});

// Global cleanup after all tests
afterAll(() => {
  // Restore original console
  global.console = console;
});

// Type definitions for test globals
declare global {
  var mockFetch: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | undefined;
}

// Export common test utilities
export * from '../../test-utils/test-helpers';
export * from './mocks';
export * from './fixtures';