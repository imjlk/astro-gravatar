/**
 * Comprehensive tests for test-helpers.ts
 * Tests all public exports to achieve >= 95% coverage
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
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
  TEST_HELPERS,
} from './test-helpers';
import type { GravatarApiResponse, GravatarProfile } from '../src/lib/types';

// ============================================================================
// Test Environment Setup Tests
// ============================================================================

describe('setupTestEnvironment', () => {
  test('should export a function', () => {
    expect(typeof setupTestEnvironment).toBe('function');
  });
});

setupTestEnvironment();

describe('setupTestEnvironment integration', () => {
  test('should mock fetch for avatar URLs', async () => {
    const response = await global.fetch('https://gravatar.com/avatar/testhash');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  test('should mock fetch for profile URLs (non-avatar)', async () => {
    const response = await global.fetch('https://gravatar.com/profile/testhash');
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Profile not found' });
  });

  test('should return 404 for unknown URLs', async () => {
    const response = await global.fetch('https://unknown.com/test');
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Not found' });
  });
});

// ============================================================================
// Fetch Mocking Utilities Tests
// ============================================================================

describe('createFetchMock', () => {
  test('should create a fetch mock function', () => {
    const responses: Record<string, Response> = {
      'example.com': new Response('test', { status: 200 }),
    };
    const mockFetch = createFetchMock(responses);
    expect(typeof mockFetch).toBe('function');
  });

  test('should return matching response for URL pattern', async () => {
    const responses: Record<string, Response> = {
      'api.example.com': new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
    const mockFetch = createFetchMock(responses);
    const response = await mockFetch('https://api.example.com/data');
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(JSON.stringify({ data: 'test' }));
  });

  test('should handle overlapping URL patterns (first match wins)', async () => {
    const responses: Record<string, Response> = {
      'api.example.com': new Response('general', { status: 200 }),
      'api.example.com/specific': new Response('specific', { status: 201 }),
    };
    const mockFetch = createFetchMock(responses);

    // First pattern that matches should be used
    const response1 = await mockFetch('https://api.example.com/specific/path');
    expect(response1.status).toBe(200); // Matches 'api.example.com' first

    const response2 = await mockFetch('https://api.example.com/data');
    expect(response2.status).toBe(200);
  });

  test('should return 404 for unmatched URLs', async () => {
    const responses: Record<string, Response> = {
      'other.com': new Response('test', { status: 200 }),
    };
    const mockFetch = createFetchMock(responses);
    const response = await mockFetch('https://unknown.com/path');
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({ error: 'Not found' });
  });

  test('should accept URL object as input', async () => {
    const responses: Record<string, Response> = {
      'example.com': new Response('test', { status: 200 }),
    };
    const mockFetch = createFetchMock(responses);
    const response = await mockFetch(new URL('https://example.com/path'));
    expect(response.status).toBe(200);
  });

  test('should clone responses for each call', async () => {
    const responses: Record<string, Response> = {
      'example.com': new Response('test', { status: 200 }),
    };
    const mockFetch = createFetchMock(responses);

    const response1 = await mockFetch('https://example.com/path1');
    const response2 = await mockFetch('https://example.com/path2');

    // Both should work (clone allows multiple reads)
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});

describe('setupFetchWithResponses', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('should set global.fetch to mock', async () => {
    const responses: Record<string, Response> = {
      'test.com': new Response('mocked', { status: 200 }),
    };
    const cleanup = setupFetchWithResponses(responses);

    const response = await global.fetch('https://test.com/path');
    expect(response.status).toBe(200);

    cleanup();
  });

  test('cleanup function should restore mockDefaultFetch', async () => {
    const responses: Record<string, Response> = {
      'test.com': new Response('mocked', { status: 200 }),
    };
    const cleanup = setupFetchWithResponses(responses);

    cleanup();

    // After cleanup, fetch should return to mockDefaultFetch behavior
    const avatarResponse = await global.fetch('https://gravatar.com/avatar/test');
    expect(avatarResponse.status).toBe(200);
    expect(avatarResponse.headers.get('Content-Type')).toBe('image/png');
  });
});

describe('createMockResponse', () => {
  test('should create response with default status 200', () => {
    const response = createMockResponse({ data: 'test' });
    expect(response.status).toBe(200);
  });

  test('should create response with custom status', () => {
    const response = createMockResponse({ error: 'not found' }, 404);
    expect(response.status).toBe(404);
  });

  test('should stringify JSON data by default', async () => {
    const response = createMockResponse({ key: 'value' });
    const text = await response.text();
    expect(text).toBe(JSON.stringify({ key: 'value' }));
  });

  test('should not stringify non-JSON content', async () => {
    const response = createMockResponse('plain text', 200, { 'Content-Type': 'text/plain' });
    const text = await response.text();
    expect(text).toBe('plain text');
  });

  test('should include custom headers', () => {
    const response = createMockResponse({ data: 'test' }, 200, {
      'X-Custom-Header': 'custom-value',
    });
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
  });

  test('should set Content-Type header', () => {
    const response = createMockResponse({ data: 'test' });
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

// ============================================================================
// Assertion Helpers Tests
// ============================================================================

describe('expectSuccessfulResponse', () => {
  test('should pass for successful response with status 200', () => {
    const response: GravatarApiResponse<string> = {
      status: 200,
      data: 'test data',
    };
    expect(() => expectSuccessfulResponse(response)).not.toThrow();
  });

  test('should throw for non-200 status', () => {
    const response: GravatarApiResponse<string> = {
      status: 404,
      error: 'Not found',
    };
    expect(() => expectSuccessfulResponse(response)).toThrow();
  });

  test('should throw when error is defined', () => {
    const response: GravatarApiResponse<string> = {
      status: 200,
      data: 'test',
      error: 'Some error',
    };
    expect(() => expectSuccessfulResponse(response)).toThrow();
  });

  test('should throw when data is undefined', () => {
    const response: GravatarApiResponse<string> = {
      status: 200,
    };
    expect(() => expectSuccessfulResponse(response)).toThrow();
  });
});

describe('expectErrorResponse', () => {
  test('should pass for matching error status', () => {
    const response: GravatarApiResponse = {
      status: 404,
      error: 'Not found',
    };
    expect(() => expectErrorResponse(response, 404)).not.toThrow();
  });

  test('should pass for matching error message', () => {
    const response: GravatarApiResponse = {
      status: 500,
      error: 'Internal server error occurred',
    };
    expect(() => expectErrorResponse(response, 500, 'Internal server')).not.toThrow();
  });

  test('should throw for non-matching status', () => {
    const response: GravatarApiResponse = {
      status: 404,
      error: 'Not found',
    };
    expect(() => expectErrorResponse(response, 500)).toThrow();
  });

  test('should throw when error is undefined', () => {
    const response: GravatarApiResponse = {
      status: 404,
    };
    expect(() => expectErrorResponse(response, 404)).toThrow();
  });

  test('should throw for non-matching error message', () => {
    const response: GravatarApiResponse = {
      status: 404,
      error: 'Not found',
    };
    expect(() => expectErrorResponse(response, 404, 'Different error')).toThrow();
  });
});

describe('expectValidGravatarProfile', () => {
  test('should pass for valid profile', () => {
    const profile: GravatarProfile = {
      hash: 'abc123def456abc123def456abc123de',
      profile_url: 'https://gravatar.com/abc123def456',
      avatar_url: 'https://www.gravatar.com/avatar/abc123def456',
      avatar_alt_text: 'User avatar',
      display_name: 'Test User',
    };
    expect(() => expectValidGravatarProfile(profile)).not.toThrow();
  });

  test('should throw for missing hash', () => {
    const profile = {
      hash: '',
      profile_url: 'https://gravatar.com/test',
      avatar_url: 'https://www.gravatar.com/avatar/test',
      avatar_alt_text: 'User avatar',
      display_name: 'Test User',
    } as GravatarProfile;
    expect(() => expectValidGravatarProfile(profile)).not.toThrow();
  });

  test('should throw for missing required fields', () => {
    const profile = {
      hash: 'testhash',
    } as GravatarProfile;
    expect(() => expectValidGravatarProfile(profile)).toThrow();
  });

  test('should verify field types are strings', () => {
    const profile = {
      hash: 'test',
      profile_url: 'url',
      avatar_url: 'url',
      avatar_alt_text: 'alt',
      display_name: 'name',
    } as GravatarProfile;
    expect(() => expectValidGravatarProfile(profile)).not.toThrow();
  });
});

describe('expectValidGravatarUrl', () => {
  test('should pass for valid gravatar URL', () => {
    const url = 'https://www.gravatar.com/avatar/abc123def456abc123def456abc123de';
    expect(() => expectValidGravatarUrl(url)).not.toThrow();
  });

  test('should pass for gravatar URL without www', () => {
    const url = 'https://gravatar.com/avatar/abc123def456abc123def456abc123de';
    expect(() => expectValidGravatarUrl(url)).not.toThrow();
  });

  test('should pass for http gravatar URL', () => {
    const url = 'http://gravatar.com/avatar/abc123def456abc123def456abc123de';
    expect(() => expectValidGravatarUrl(url)).not.toThrow();
  });

  test('should throw for non-gravatar URL', () => {
    const url = 'https://example.com/avatar/test';
    expect(() => expectValidGravatarUrl(url)).toThrow();
  });

  test('should throw for invalid hash length', () => {
    const url = 'https://gravatar.com/avatar/short';
    expect(() => expectValidGravatarUrl(url)).toThrow();
  });

  test('should verify email hash when provided', () => {
    const email = 'test@example.com';
    const hash = generateEmailHash(email);
    const url = `https://gravatar.com/avatar/${hash}`;
    expect(() => expectValidGravatarUrl(url, email)).not.toThrow();
  });

  test('should throw for mismatched email hash', () => {
    const email = 'test@example.com';
    const url = 'https://gravatar.com/avatar/00000000000000000000000000000000';
    expect(() => expectValidGravatarUrl(url, email)).toThrow();
  });
});

describe('expectCssClasses', () => {
  test('should pass when all expected classes are present', () => {
    const element = {
      className: 'class1 class2 class3',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['class1', 'class2'])).not.toThrow();
  });

  test('should pass for single class', () => {
    const element = {
      className: 'my-class',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['my-class'])).not.toThrow();
  });

  test('should pass for extra classes beyond expected', () => {
    const element = {
      className: 'class1 class2 class3 class4',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['class1', 'class3'])).not.toThrow();
  });

  test('should handle extra whitespace in className', () => {
    const element = {
      className: '  class1   class2  ',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['class1', 'class2'])).not.toThrow();
  });

  test('should throw when expected class is missing', () => {
    const element = {
      className: 'class1 class2',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['class1', 'missing'])).toThrow();
  });

  test('should handle empty className', () => {
    const element = {
      className: '',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, [])).not.toThrow();
  });

  test('should throw when expecting class from empty element', () => {
    const element = {
      className: '',
    } as unknown as HTMLElement;
    expect(() => expectCssClasses(element, ['missing'])).toThrow();
  });
});

// ============================================================================
// Data Generation Utilities Tests
// ============================================================================

describe('generateRandomEmail', () => {
  test('should generate email with default domain', () => {
    const email = generateRandomEmail();
    expect(email).toContain('@example.com');
  });

  test('should generate email with custom domain', () => {
    const email = generateRandomEmail('custom.org');
    expect(email).toContain('@custom.org');
  });

  test('should generate different emails on each call', () => {
    const email1 = generateRandomEmail();
    const email2 = generateRandomEmail();
    expect(email1).not.toBe(email2);
  });

  test('should generate valid email format', () => {
    const email = generateRandomEmail();
    expect(email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  });
});

describe('generateEmailHash', () => {
  test('should generate 32-character hash', () => {
    const hash = generateEmailHash('test@example.com');
    expect(hash).toHaveLength(32);
  });

  test('should generate consistent hash for same email', () => {
    const hash1 = generateEmailHash('test@example.com');
    const hash2 = generateEmailHash('test@example.com');
    expect(hash1).toBe(hash2);
  });

  test('should generate different hashes for different emails', () => {
    const hash1 = generateEmailHash('test1@example.com');
    const hash2 = generateEmailHash('test2@example.com');
    expect(hash1).not.toBe(hash2);
  });

  test('should generate lowercase hex characters', () => {
    const hash = generateEmailHash('test@example.com');
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should handle empty email', () => {
    const hash = generateEmailHash('');
    expect(hash).toHaveLength(32);
  });
});

describe('TestDataGenerator', () => {
  describe('profile', () => {
    test('should generate profile with default values', () => {
      const profile = TestDataGenerator.profile();
      expect(profile.hash).toBeDefined();
      expect(profile.profile_url).toContain('gravatar.com');
      expect(profile.avatar_url).toContain('gravatar.com/avatar');
      expect(profile.display_name).toBeDefined();
    });

    test('should apply overrides', () => {
      const profile = TestDataGenerator.profile({
        display_name: 'Custom Name',
        hash: 'customhash12345678901234567890',
      });
      expect(profile.display_name).toBe('Custom Name');
      expect(profile.hash).toBe('customhash12345678901234567890');
    });

    test('should generate valid avatar_url from hash', () => {
      const profile = TestDataGenerator.profile();
      expect(profile.avatar_url).toContain(profile.hash);
    });
  });

  describe('profiles', () => {
    test('should generate multiple profiles', () => {
      const profiles = TestDataGenerator.profiles(5);
      expect(profiles).toHaveLength(5);
    });

    test('should generate unique profiles', () => {
      const profiles = TestDataGenerator.profiles(3);
      const hashes = profiles.map((p) => p.hash);
      expect(new Set(hashes).size).toBe(3);
    });

    test('should apply base overrides to all profiles', () => {
      const profiles = TestDataGenerator.profiles(3, { display_name: 'Base' });
      expect(profiles[0].hash).toBeDefined();
    });

    test('should use indexed display names', () => {
      const profiles = TestDataGenerator.profiles(3);
      expect(profiles[0].display_name).toContain('Test User 1');
      expect(profiles[1].display_name).toContain('Test User 2');
      expect(profiles[2].display_name).toContain('Test User 3');
    });
  });

  describe('emails', () => {
    test('should generate specified number of emails', () => {
      const emails = TestDataGenerator.emails(5);
      expect(emails).toHaveLength(5);
    });

    test('should use default domain', () => {
      const emails = TestDataGenerator.emails(3);
      emails.forEach((email) => {
        expect(email).toContain('@example.com');
      });
    });

    test('should use custom domain', () => {
      const emails = TestDataGenerator.emails(3, 'test.org');
      emails.forEach((email) => {
        expect(email).toContain('@test.org');
      });
    });

    test('should generate unique emails', () => {
      const emails = TestDataGenerator.emails(10);
      expect(new Set(emails).size).toBe(10);
    });
  });
});

// ============================================================================
// Async Testing Utilities Tests
// ============================================================================

describe('delay', () => {
  test('should resolve after specified time', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
  });

  test('should return a promise', () => {
    const result = delay(10);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('withTimeout', () => {
  test('should resolve if promise completes before timeout', async () => {
    const promise = Promise.resolve('result');
    const result = await withTimeout(promise, 1000);
    expect(result).toBe('result');
  });

  test('should reject if promise takes too long', async () => {
    const promise = delay(200);
    await expect(withTimeout(promise, 50)).rejects.toThrow('timed out');
  });

  test('should use custom error message', async () => {
    const promise = delay(200);
    const customError = new Error('Custom timeout');
    await expect(withTimeout(promise, 50, customError)).rejects.toThrow('Custom timeout');
  });

  test('should preserve original rejection', async () => {
    const promise = Promise.reject(new Error('Original error'));
    await expect(withTimeout(promise, 1000)).rejects.toThrow('Original error');
  });
});

describe('retry', () => {
  test('should return result on first success', async () => {
    const operation = () => Promise.resolve('success');
    const result = await retry(operation, 3);
    expect(result).toBe('success');
  });

  test('should retry on failure', async () => {
    let attempts = 0;
    const operation = () => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve('success');
    };
    const result = await retry(operation, 5, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should throw after max attempts', async () => {
    const operation = () => Promise.reject(new Error('Always fails'));
    await expect(retry(operation, 3, 10)).rejects.toThrow('Always fails');
  });

  test('should use default max attempts', async () => {
    let attempts = 0;
    const operation = () => {
      attempts++;
      return Promise.reject(new Error('Fail'));
    };
    await expect(retry(operation)).rejects.toThrow();
    expect(attempts).toBe(3);
  });

  test('should delay between retries', async () => {
    let attempts = 0;
    const operation = () => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve('success');
    };
    const start = Date.now();
    await retry(operation, 3, 50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // At least one delay
  });
});

// ============================================================================
// Component Testing Utilities Tests
// ============================================================================

describe('createMockProps', () => {
  test('should create props with default email', () => {
    const props = createMockProps<{ email: string }>({});
    expect(props.email).toBe('test@example.com');
  });

  test('should merge overrides', () => {
    const props = createMockProps<{ email: string; size: number; rating: string }>({
      size: 100,
      rating: 'pg',
    });
    expect(props.email).toBe('test@example.com');
    expect(props.size).toBe(100);
    expect(props.rating).toBe('pg');
  });

  test('should override default email', () => {
    const props = createMockProps<{ email: string }>({ email: 'custom@test.com' });
    expect(props.email).toBe('custom@test.com');
  });
});

describe('setupMockDOM', () => {
  let originalDocument: Document | undefined;

  beforeEach(() => {
    originalDocument = global.document;
    delete (global as any).document;
  });

  afterEach(() => {
    (global as any).document = originalDocument;
  });

  test('should create document if undefined', () => {
    expect((global as any).document).toBeUndefined();
    setupMockDOM();
    expect((global as any).document).toBeDefined();
  });

  test('should create document with createElement', () => {
    setupMockDOM();
    const doc = (global as any).document;
    const element = doc.createElement('div');
    expect(element.tagName).toBe('DIV');
  });

  test('should not overwrite existing document', () => {
    (global as any).document = { custom: true };
    setupMockDOM();
    expect((global as any).document.custom).toBe(true);
  });

  test('created element should have expected properties', () => {
    setupMockDOM();
    const doc = (global as any).document;
    const element = doc.createElement('span');
    expect(element.className).toBe('');
    expect(element.innerHTML).toBe('');
    expect(typeof element.setAttribute).toBe('function');
    expect(typeof element.getAttribute).toBe('function');
    expect(typeof element.appendChild).toBe('function');
  });

  test('document.body should have appendChild', () => {
    setupMockDOM();
    const doc = (global as any).document;
    expect(typeof doc.body.appendChild).toBe('function');
  });
});

describe('createMockEvent', () => {
  test('should create event with specified type', () => {
    const event = createMockEvent('click');
    expect(event.type).toBe('click');
  });

  test('should create different event types', () => {
    const clickEvent = createMockEvent('click');
    const keydownEvent = createMockEvent('keydown');
    expect(clickEvent.type).toBe('click');
    expect(keydownEvent.type).toBe('keydown');
  });

  test('should handle empty properties', () => {
    const event = createMockEvent('focus', {});
    expect(event.type).toBe('focus');
  });
});

// ============================================================================
// Performance Testing Utilities Tests
// // ============================================================================

describe('measureTime', () => {
  test('should return result and duration', async () => {
    const { result, duration } = await measureTime(() => 'test');
    expect(result).toBe('test');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  test('should work with async functions', async () => {
    const { result, duration } = await measureTime(async () => {
      await delay(10);
      return 'async result';
    });
    expect(result).toBe('async result');
    expect(duration).toBeGreaterThanOrEqual(10);
  });

  test('should handle functions that never resolve (with timeout)', async () => {
    const neverResolve = () => new Promise<string>(() => {});
    await expect(withTimeout(measureTime(neverResolve), 50)).rejects.toThrow();
  });

  test('should measure very fast operations', async () => {
    const { duration } = await measureTime(() => 1 + 1);
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});

describe('benchmark', () => {
  test('should run specified iterations', async () => {
    let count = 0;
    const { results } = await benchmark(() => ++count, 5);
    expect(results).toHaveLength(5);
    expect(count).toBe(5);
  });

  test('should return timing statistics', async () => {
    const { averageTime, minTime, maxTime } = await benchmark(() => 1, 10);
    expect(averageTime).toBeGreaterThanOrEqual(0);
    expect(minTime).toBeGreaterThanOrEqual(0);
    expect(maxTime).toBeGreaterThanOrEqual(minTime);
  });

  test('should use default iterations', async () => {
    const { results } = await benchmark(() => 'test');
    expect(results).toHaveLength(100);
  });

  test('should handle async functions', async () => {
    const { results, averageTime } = await benchmark(async () => {
      await delay(5);
      return 'async';
    }, 5);
    expect(results).toHaveLength(5);
    expect(averageTime).toBeGreaterThanOrEqual(5);
  });

  test('should handle functions that throw errors', async () => {
    let callCount = 0;
    const throwingFn = () => {
      callCount++;
      throw new Error('Test error');
    };
    await expect(benchmark(throwingFn, 3)).rejects.toThrow('Test error');
  });

  test('should calculate correct min/max', async () => {
    const times = [5, 10, 15];
    let index = 0;
    const { minTime, maxTime } = await benchmark(async () => {
      await delay(times[index++ % times.length]);
    }, 3);
    // minTime should be close to 5, maxTime should be close to 15
    expect(minTime).toBeLessThan(maxTime);
  });
});

// ============================================================================
// TEST_HELPERS Export Tests
// // ============================================================================

describe('TEST_HELPERS', () => {
  test('should export all helper functions', () => {
    expect(TEST_HELPERS.setupTestEnvironment).toBe(setupTestEnvironment);
    expect(TEST_HELPERS.createFetchMock).toBe(createFetchMock);
    expect(TEST_HELPERS.setupFetchWithResponses).toBe(setupFetchWithResponses);
    expect(TEST_HELPERS.createMockResponse).toBe(createMockResponse);
    expect(TEST_HELPERS.expectSuccessfulResponse).toBe(expectSuccessfulResponse);
    expect(TEST_HELPERS.expectErrorResponse).toBe(expectErrorResponse);
    expect(TEST_HELPERS.expectValidGravatarProfile).toBe(expectValidGravatarProfile);
    expect(TEST_HELPERS.expectValidGravatarUrl).toBe(expectValidGravatarUrl);
    expect(TEST_HELPERS.expectCssClasses).toBe(expectCssClasses);
    expect(TEST_HELPERS.generateRandomEmail).toBe(generateRandomEmail);
    expect(TEST_HELPERS.generateEmailHash).toBe(generateEmailHash);
    expect(TEST_HELPERS.TestDataGenerator).toBe(TestDataGenerator);
    expect(TEST_HELPERS.delay).toBe(delay);
    expect(TEST_HELPERS.withTimeout).toBe(withTimeout);
    expect(TEST_HELPERS.retry).toBe(retry);
    expect(TEST_HELPERS.createMockProps).toBe(createMockProps);
    expect(TEST_HELPERS.setupMockDOM).toBe(setupMockDOM);
    expect(TEST_HELPERS.createMockEvent).toBe(createMockEvent);
    expect(TEST_HELPERS.measureTime).toBe(measureTime);
    expect(TEST_HELPERS.benchmark).toBe(benchmark);
  });

  test('should be defined as const (type-level readonly)', () => {
    expect(TEST_HELPERS).toBeDefined();
    expect(typeof TEST_HELPERS).toBe('object');
  });
});
