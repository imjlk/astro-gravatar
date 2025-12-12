/**
 * Common testing utilities and helpers for astro-gravatar package
 * Provides reusable functions for setting up tests, assertions, and common patterns
 */

import { beforeAll, afterEach, afterAll, expect } from 'bun:test';
import type { GravatarApiResponse, GravatarProfile } from '../src/lib/types';

// ============================================================================
// Test Environment Setup
// ============================================================================

/**
 * Sets up a test environment with mocked fetch
 */
export function setupTestEnvironment() {
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Mock fetch by default
    global.fetch = mockDefaultFetch;
  });

  afterEach(() => {
    // Reset any test-specific mocks
    global.fetch = mockDefaultFetch;
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });
}

/**
 * Default mock fetch implementation
 */
async function mockDefaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();

  // Default responses for common patterns
  if (url.includes('gravatar.com/avatar/')) {
    return new Response(Buffer.from('fake-avatar-data'), {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  }

  if (url.includes('gravatar.com/') && !url.includes('/avatar/')) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// Fetch Mocking Utilities
// ============================================================================

/**
 * Creates a custom fetch mock for testing
 */
export function createFetchMock(responses: Record<string, Response>) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Find matching response
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return response.clone();
      }
    }

    // Default response
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * Sets up fetch with custom responses
 */
export function setupFetchWithResponses(responses: Record<string, Response>) {
  const mockFetch = createFetchMock(responses);
  global.fetch = mockFetch;
  return () => {
    global.fetch = mockDefaultFetch;
  };
}

/**
 * Creates a mock Response object
 */
export function createMockResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  const contentType = headers['Content-Type'] || 'application/json';
  const body = contentType.includes('application/json') ? JSON.stringify(data) : data;

  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      ...headers,
    },
  });
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts that a Gravatar API response is successful
 */
export function expectSuccessfulResponse<T>(response: GravatarApiResponse<T>) {
  expect(response.status).toBe(200);
  expect(response.error).toBeUndefined();
  expect(response.data).toBeDefined();
}

/**
 * Asserts that a Gravatar API response is an error
 */
export function expectErrorResponse(
  response: GravatarApiResponse,
  expectedStatus: number,
  expectedError?: string
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.error).toBeDefined();
  if (expectedError) {
    expect(response.error).toContain(expectedError);
  }
}

/**
 * Asserts that a Gravatar profile has required fields
 */
export function expectValidGravatarProfile(profile: GravatarProfile) {
  expect(profile).toHaveProperty('hash');
  expect(profile).toHaveProperty('profile_url');
  expect(profile).toHaveProperty('avatar_url');
  expect(profile).toHaveProperty('avatar_alt_text');
  expect(profile).toHaveProperty('display_name');

  expect(typeof profile.hash).toBe('string');
  expect(typeof profile.profile_url).toBe('string');
  expect(typeof profile.avatar_url).toBe('string');
  expect(typeof profile.avatar_alt_text).toBe('string');
  expect(typeof profile.display_name).toBe('string');
}

/**
 * Asserts that a URL is a valid Gravatar avatar URL
 */
export function expectValidGravatarUrl(url: string, email?: string) {
  expect(url).toMatch(/^https?:\/\/(www\.)?gravatar\.com\/avatar\/[a-f0-9]{32}/);

  if (email) {
    // You could add hash verification here if needed
    const expectedHash = generateEmailHash(email.toLowerCase().trim());
    expect(url).toContain(expectedHash);
  }
}

/**
 * Asserts that CSS classes are properly applied
 */
export function expectCssClasses(element: HTMLElement, expectedClasses: string[]) {
  const actualClasses = element.className.split(' ').filter(Boolean);
  expectedClasses.forEach(expectedClass => {
    expect(actualClasses).toContain(expectedClass);
  });
}

// ============================================================================
// Data Generation Utilities
// ============================================================================

/**
 * Generates a random email for testing
 */
export function generateRandomEmail(domain: string = 'example.com'): string {
  const randomString = Math.random().toString(36).substring(2, 8);
  return `test_${randomString}@${domain}`;
}

/**
 * Generates a test email hash (SHA256 placeholder)
 * In real implementation, this would use actual SHA256 hashing
 */
export function generateEmailHash(email: string): string {
  // This is a mock implementation - in real code, use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to hex and pad to 32 characters (mock MD5-style)
  const hexHash = Math.abs(hash).toString(16).padEnd(32, '0').substring(0, 32);
  return hexHash;
}

/**
 * Generates test data for various scenarios
 */
export const TestDataGenerator = {
  /**
   * Generates profile data with custom overrides
   */
  profile: (overrides: Partial<GravatarProfile> = {}): GravatarProfile => {
    const email = generateRandomEmail();
    const hash = generateEmailHash(email);

    return {
      hash,
      profile_url: `https://gravatar.com/${hash}`,
      avatar_url: `https://www.gravatar.com/avatar/${hash}`,
      avatar_alt_text: `Avatar for ${email}`,
      display_name: `Test User (${email})`,
      ...overrides,
    };
  },

  /**
   * Generates multiple profiles
   */
  profiles: (count: number, baseOverrides: Partial<GravatarProfile> = {}): GravatarProfile[] => {
    return Array.from({ length: count }, (_, index) =>
      TestDataGenerator.profile({
        display_name: `Test User ${index + 1}`,
        ...baseOverrides,
      })
    );
  },

  /**
   * Generates a list of emails
   */
  emails: (count: number, domain: string = 'example.com'): string[] => {
    return Array.from({ length: count }, () => generateRandomEmail(domain));
  },
};

// ============================================================================
// Async Testing Utilities
// ============================================================================

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a promise that rejects after a specified timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error(`Operation timed out after ${timeoutMs}ms`)
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(timeoutError), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retries an async operation a specified number of times
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError!;
}

// ============================================================================
// Component Testing Utilities
// ============================================================================

/**
 * Creates mock props for testing components
 */
export function createMockProps<T>(overrides: Partial<T>): T {
  return {
    email: 'test@example.com',
    ...overrides,
  } as T;
}

/**
 * Simulates a DOM environment for component testing
 */
export function setupMockDOM() {
  // Basic DOM simulation
  if (typeof document === 'undefined') {
    (global as any).document = {
      createElement: (tag: string) => ({
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
      }),
      body: {
        appendChild: () => {},
      },
    };
  }
}

/**
 * Creates a mock event for testing event handlers
 */
export function createMockEvent(type: string, properties: Record<string, any> = {}): Event {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
}

// ============================================================================
// Performance Testing Utilities
// ============================================================================

/**
 * Measures the execution time of a function
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Benchmarks a function multiple times
 */
export async function benchmark<T>(
  fn: () => T | Promise<T>,
  iterations: number = 100
): Promise<{ results: T[]; averageTime: number; minTime: number; maxTime: number }> {
  const results: T[] = [];
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { result, duration } = await measureTime(fn);
    results.push(result);
    times.push(duration);
  }

  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    results,
    averageTime,
    minTime,
    maxTime,
  };
}

// ============================================================================
// Export All Helpers
// ============================================================================

export const TEST_HELPERS = {
  setupTestEnvironment,
  createFetchMock,
  setupFetchWithResponses,
  createMockResponse,
  expectSuccessfulResponse,
  expectErrorResponse,
  expectValidGravatarProfile,
  expectValidGravatarUrl,
  expectCssClasses,
  generateRandomEmail,
  generateEmailHash,
  TestDataGenerator,
  delay,
  withTimeout,
  retry,
  createMockProps,
  setupMockDOM,
  createMockEvent,
  measureTime,
  benchmark,
} as const;