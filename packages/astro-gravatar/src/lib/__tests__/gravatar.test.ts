/**
 * Comprehensive unit tests for core API functions in gravatar.ts
 * Tests all 9 core functions with various scenarios, edge cases, and error handling
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  buildAvatarUrl,
  buildProfileUrl,
  buildQRCodeUrl,
  getProfile,
  getProfiles,
  clearApiCache,
  getApiCacheStats,
  validateAvatarParams,
  getDefaultAvatarConfig,
  GRAVATAR_AVATAR_BASE,
  GRAVATAR_API_BASE,
  GRAVATAR_QR_BASE,
} from '../gravatar';
import { GravatarError, GRAVATAR_ERROR_CODES, type GravatarProfile } from '../types';
import {
  setupTestEnvironment,
  setupFetchWithResponses,
  createMockResponse,
  TestDataGenerator,
  generateRandomEmail,
  measureTime,
} from '../../../test-utils/test-helpers';
import { hashEmailWithCache } from '../../utils/hash';

// Setup test environment with mocked fetch
setupTestEnvironment();

describe('URL Building Functions', () => {
  describe('buildAvatarUrl', () => {
    const testEmail = 'test@example.com';

    test('should build basic avatar URL with just email', async () => {
      const url = await buildAvatarUrl(testEmail);
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}`);
      expect(url).not.toContain('?');
    });

    test('should build avatar URL with size parameter', async () => {
      const url = await buildAvatarUrl(testEmail, { size: 200 });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}?s=200`);
    });

    test('should build avatar URL with rating parameter', async () => {
      const url = await buildAvatarUrl(testEmail, { rating: 'pg' });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}?r=pg`);
    });

    test('should build avatar URL with default image parameter', async () => {
      const url = await buildAvatarUrl(testEmail, { default: 'identicon' });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}?d=identicon`);
    });

    test('should build avatar URL with custom default URL', async () => {
      const customUrl = 'https://example.com/default-avatar.png';
      const url = await buildAvatarUrl(testEmail, { default: customUrl });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toContain(`${GRAVATAR_AVATAR_BASE}/${hash}?d=`);
      // Note: URLSearchParams will automatically encode the URL
      expect(url).toContain('https%3A%2F%2Fexample.com%2Fdefault-avatar.png');
    });

    test('should build avatar URL with force default parameter', async () => {
      const url = await buildAvatarUrl(testEmail, { forceDefault: true });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}?f=y`);
    });

    test('should build avatar URL with multiple parameters', async () => {
      const url = await buildAvatarUrl(testEmail, {
        size: 150,
        rating: 'r',
        default: 'monsterid',
        forceDefault: true,
      });
      const hash = await hashEmailWithCache(testEmail);

      // Parameters can be in any order, so check for all of them
      expect(url).toContain(`${GRAVATAR_AVATAR_BASE}/${hash}?`);
      expect(url).toContain('s=150');
      expect(url).toContain('r=r');
      expect(url).toContain('d=monsterid');
      expect(url).toContain('f=y');
    });

    test('should handle email with uppercase letters', async () => {
      const upperEmail = 'Test@EXAMPLE.COM';
      const url = await buildAvatarUrl(upperEmail);
      const hash = await hashEmailWithCache(upperEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}`);
    });

    test('should throw error for invalid size (too small)', async () => {
      await expect(buildAvatarUrl(testEmail, { size: -1 })).rejects.toThrow(GravatarError);
    });

    test('should throw error for invalid size (too large)', async () => {
      await expect(buildAvatarUrl(testEmail, { size: 2049 })).rejects.toThrow(GravatarError);
    });

    test('should handle boundary sizes', async () => {
      await expect(buildAvatarUrl(testEmail, { size: 1 })).resolves.toBeTruthy();
      await expect(buildAvatarUrl(testEmail, { size: 2048 })).resolves.toBeTruthy();
    });

    test('should not include default parameters if they match defaults', async () => {
      const url = await buildAvatarUrl(testEmail, {
        size: 80, // DEFAULT_AVATAR_SIZE
        rating: 'g', // DEFAULT_AVATAR_RATING
        default: 'mp', // DEFAULT_AVATAR_IMAGE
      });
      const hash = await hashEmailWithCache(testEmail);

      expect(url).toBe(`${GRAVATAR_AVATAR_BASE}/${hash}`);
    });

    test('should test all predefined default avatar types', async () => {
      const defaultTypes = ['404', 'mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank'];

      for (const defaultType of defaultTypes) {
        const url = await buildAvatarUrl(testEmail, { default: defaultType as any });
        // 'mp' is the default, so it won't appear in the URL unless it's the only parameter
        if (defaultType === 'mp') {
          // Should not add d=mp to URL since it's the default
          expect(url).not.toContain('d=mp');
        } else {
          expect(url).toContain(`d=${defaultType}`);
        }
      }
    });
  });

  describe('buildProfileUrl', () => {
    test('should build basic profile URL', async () => {
      const email = 'test@example.com';
      const url = await buildProfileUrl(email);
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_API_BASE}/profiles/${hash}`);
    });

    test('should build profile URL with custom base URL', async () => {
      const email = 'test@example.com';
      const customBase = 'https://proxy.example.com/gravatar';
      const url = await buildProfileUrl(email, { baseUrl: customBase });
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${customBase}/profiles/${hash}`);
    });

    test('should handle email with uppercase and spaces', async () => {
      const email = '  Test@EXAMPLE.COM  ';
      const url = await buildProfileUrl(email);
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_API_BASE}/profiles/${hash}`);
    });
  });

  describe('buildQRCodeUrl', () => {
    test('should build basic QR code URL', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email);
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_QR_BASE}/${hash}`);
    });

    test('should build QR code URL with size parameter', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, { size: 200 });
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_QR_BASE}/${hash}?size=200`);
    });

    test('should build QR code URL with version parameter', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, { version: 3 });
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_QR_BASE}/${hash}?version=3`);
    });

    test('should build QR code URL with type parameter', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, { type: 'user' });
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_QR_BASE}/${hash}?type=user`);
    });

    test('should build QR code URL with UTM parameters', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, {
        utmMedium: 'social',
        utmCampaign: 'profile_share',
      });
      const hash = await hashEmailWithCache(email);

      expect(url).toContain(`${GRAVATAR_QR_BASE}/${hash}?`);
      expect(url).toContain('utm_medium=social');
      expect(url).toContain('utm_campaign=profile_share');
    });

    test('should build QR code URL with all parameters', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, {
        size: 300,
        version: 3,
        type: 'gravatar',
        utmMedium: 'email',
        utmCampaign: 'signature',
      });
      const hash = await hashEmailWithCache(email);

      expect(url).toContain(`${GRAVATAR_QR_BASE}/${hash}?`);
      expect(url).toContain('size=300');
      expect(url).toContain('version=3');
      expect(url).toContain('type=gravatar');
      expect(url).toContain('utm_medium=email');
      expect(url).toContain('utm_campaign=signature');
    });

    test('should throw error for invalid QR code size', async () => {
      await expect(buildQRCodeUrl('test@example.com', { size: -1 })).rejects.toThrow(GravatarError);
      await expect(buildQRCodeUrl('test@example.com', { size: 1001 })).rejects.toThrow(GravatarError);
    });

    test('should handle boundary sizes for QR code', async () => {
      await expect(buildQRCodeUrl('test@example.com', { size: 1 })).resolves.toBeTruthy();
      await expect(buildQRCodeUrl('test@example.com', { size: 1000 })).resolves.toBeTruthy();
    });

    test('should not include default size parameter', async () => {
      const email = 'test@example.com';
      const url = await buildQRCodeUrl(email, { size: 80 }); // Default size
      const hash = await hashEmailWithCache(email);

      expect(url).toBe(`${GRAVATAR_QR_BASE}/${hash}`);
    });
  });
});

describe('API Client Functions', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearApiCache();
  });

  describe('getProfile', () => {
    test('should fetch profile successfully', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);
      const mockProfile = TestDataGenerator.profile({
        display_name: 'Test User',
        hash: emailHash, // Use real hash
      });

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(mockProfile, 200, {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': '999',
          'X-RateLimit-Reset': String(Date.now() + 3600000),
        }),
      });

      const profile = await getProfile(email);

      expect(profile.display_name).toBe('Test User');
      expect(profile.hash).toBe(emailHash);

      restoreFetch();
    });

    test('should use API key when provided', async () => {
      const email = 'test@example.com';
      const apiKey = 'test-api-key';
      const mockProfile = TestDataGenerator.profile();
      const emailHash = await hashEmailWithCache(email);

      let receivedHeaders: Record<string, string> = {};
      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(mockProfile, 200),
      });

      // Override fetch to capture headers
      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit | BunFetchRequestInit) => {
        receivedHeaders = (init?.headers as Record<string, string>) || {};
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes(`profiles/${emailHash}`)) {
          return createMockResponse(mockProfile, 200);
        }

        return createMockResponse({ error: 'Not found' }, 404);
      }) as any;

      await getProfile(email, { apiKey });

      expect(receivedHeaders['Authorization']).toBe(`Bearer ${apiKey}`);

      restoreFetch();
    });

    test('should handle 404 error', async () => {
      const email = 'nonexistent@example.com';
      const emailHash = await hashEmailWithCache(email);

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(
          { error: 'Profile not found' },
          404
        ),
      });

      await expect(getProfile(email)).rejects.toThrow(GravatarError);

      try {
        await getProfile(email);
      } catch (error) {
        expect(error).toBeInstanceOf(GravatarError);
        if (error instanceof GravatarError) {
          expect(error.code).toBe(GRAVATAR_ERROR_CODES.NOT_FOUND);
          expect(error.status).toBe(404);
        }
      }

      restoreFetch();
    });

    test('should handle rate limiting', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(
          { error: 'Rate limit exceeded' },
          429,
          {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + 3600000),
          }
        ),
      });

      try {
        await getProfile(email);
      } catch (error) {
        expect(error).toBeInstanceOf(GravatarError);
        if (error instanceof GravatarError) {
          expect(error.code).toBe(GRAVATAR_ERROR_CODES.RATE_LIMITED);
          expect(error.status).toBe(429);
          expect(error.rateLimit).toBeDefined();
          expect(error.rateLimit?.remaining).toBe(0);
        }
      }

      restoreFetch();
    });

    test('should handle network timeout', async () => {
      const email = 'test@example.com';

      // Mock fetch that returns an abort error when signal is aborted
      global.fetch = (async (_: unknown, init?: RequestInit | BunFetchRequestInit) => {
        return new Promise((_, reject) => {
          const signal = init?.signal as AbortSignal;

          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('Request timeout', 'AbortError'));
            });
          }
        });
      }) as any;

      try {
        await getProfile(email, { timeout: 100 }); // 100ms timeout
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(GravatarError);
        if (error instanceof GravatarError) {
          expect(error.code).toBe(GRAVATAR_ERROR_CODES.NETWORK_ERROR);
          expect(error.message).toContain('timeout');
        }
      }
    });

    test('should handle empty response', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(null, 200),
      });

      await expect(getProfile(email)).rejects.toThrow(GravatarError);

      restoreFetch();
    });

    test('should cache responses', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);
      const mockProfile = TestDataGenerator.profile();
      let fetchCallCount = 0;

      global.fetch = (async (input: RequestInfo | URL) => {
        fetchCallCount++;
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes(`profiles/${emailHash}`)) {
          return createMockResponse(mockProfile, 200, {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '999',
            'X-RateLimit-Reset': String(Date.now() + 3600000),
          });
        }

        return createMockResponse({ error: 'Not found' }, 404);
      }) as any;

      // First call
      await getProfile(email);
      expect(fetchCallCount).toBe(1);

      // Second call should use cache
      await getProfile(email);
      expect(fetchCallCount).toBe(1); // Should still be 1
    });
  });

  describe('getProfiles', () => {
    test('should fetch multiple profiles successfully', async () => {
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const mockProfiles = emails.map(email =>
        TestDataGenerator.profile({ display_name: `User ${email.split('@')[0]}` })
      );

      const emailHashes = await Promise.all(emails.map(e => hashEmailWithCache(e)));

      const restoreFetch = setupFetchWithResponses(
        Object.fromEntries(
          emailHashes.map((hash, index) => [
            `profiles/${hash}`,
            createMockResponse(mockProfiles[index], 200),
          ])
        )
      );

      const profiles = await getProfiles(emails);

      expect(profiles).toHaveLength(3);
      expect(profiles[0].display_name).toBe('User user1');
      expect(profiles[1].display_name).toBe('User user2');
      expect(profiles[2].display_name).toBe('User user3');

      restoreFetch();
    });

    test('should handle partial failures gracefully', async () => {
      const emails = ['existing@example.com', 'nonexistent@example.com', 'another@example.com'];
      const emailHashes = await Promise.all(emails.map(e => hashEmailWithCache(e)));
      const mockProfile = TestDataGenerator.profile({ display_name: 'Existing User' });

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHashes[0]}`]: createMockResponse(mockProfile, 200),
        [`profiles/${emailHashes[1]}`]: createMockResponse(
          { error: 'Profile not found' },
          404
        ),
        [`profiles/${emailHashes[2]}`]: createMockResponse(
          TestDataGenerator.profile({ display_name: 'Another User' }),
          200
        ),
      });

      const profiles = await getProfiles(emails);

      // Should return 2 successful profiles, skipping the failed one
      expect(profiles).toHaveLength(2);
      expect(profiles.some(p => p.display_name === 'Existing User')).toBe(true);
      expect(profiles.some(p => p.display_name === 'Another User')).toBe(true);

      restoreFetch();
    });

    test('should handle all profiles failing', async () => {
      const emails = ['nonexistent1@example.com', 'nonexistent2@example.com'];
      const emailHashes = await Promise.all(emails.map(e => hashEmailWithCache(e)));

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHashes[0]}`]: createMockResponse(
          { error: 'Profile not found' },
          404
        ),
        [`profiles/${emailHashes[1]}`]: createMockResponse(
          { error: 'Profile not found' },
          404
        ),
      });

      await expect(getProfiles(emails)).rejects.toThrow(GravatarError);

      restoreFetch();
    });
  });

  describe('Cache Functions', () => {
    test('clearApiCache should clear all cached entries', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);
      const mockProfile = TestDataGenerator.profile();

      let fetchCallCount = 0;

      global.fetch = (async (input: RequestInfo | URL) => {
        fetchCallCount++;
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes(`profiles/${emailHash}`)) {
          return createMockResponse(mockProfile, 200, {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '999',
            'X-RateLimit-Reset': String(Date.now() + 3600000),
          });
        }

        return createMockResponse({ error: 'Not found' }, 404);
      }) as any;

      // First call to populate cache
      await getProfile(email);
      expect(fetchCallCount).toBe(1);

      // Verify cache has entries
      const statsBefore = getApiCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      // Clear cache
      clearApiCache();

      // Verify cache is empty
      const statsAfter = getApiCacheStats();
      expect(statsAfter.size).toBe(0);

      // Second call should make new request
      await getProfile(email);
      expect(fetchCallCount).toBe(2);
    });

    test('getApiCacheStats should return correct statistics', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);
      const mockProfile = TestDataGenerator.profile();

      const restoreFetch = setupFetchWithResponses({
        [`profiles/${emailHash}`]: createMockResponse(mockProfile, 200, {
          'X-RateLimit-Limit': '1000',
          'X-RateLimit-Remaining': '999',
          'X-RateLimit-Reset': String(Date.now() + 3600000),
        }),
      });

      // Initially empty
      let stats = getApiCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);

      // Add to cache
      await getProfile(email);

      // Check stats
      stats = getApiCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toContain('profile:');
      expect(stats.entries[0].expires).toBeGreaterThan(Date.now());

      restoreFetch();
    });

    test('cache should respect expiration', async () => {
      const email = 'test@example.com';
      const emailHash = await hashEmailWithCache(email);
      const mockProfile = TestDataGenerator.profile();

      let fetchCallCount = 0;

      global.fetch = (async (input: RequestInfo | URL) => {
        fetchCallCount++;
        const url = typeof input === 'string' ? input : input.toString();

        if (url.includes(`profiles/${emailHash}`)) {
          return createMockResponse(mockProfile, 200, {
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': '999',
            'X-RateLimit-Reset': String(Date.now() - 1000), // Reset time in past
          });
        }

        return createMockResponse({ error: 'Not found' }, 404);
      }) as any;

      // First call
      await getProfile(email);
      expect(fetchCallCount).toBe(1);

      // Second call should trigger new request due to expired cache
      // (using past reset time to force immediate expiration)
      await getProfile(email);
      expect(fetchCallCount).toBe(2);
    });
  });
});

describe('Utility Functions', () => {
  describe('validateAvatarParams', () => {
    test('should accept valid size parameter', () => {
      expect(() => {
        validateAvatarParams(100);
      }).not.toThrow();
    });

    test('should accept valid rating parameter', () => {
      const validRatings = ['g', 'pg', 'r', 'x'];

      validRatings.forEach(rating => {
        expect(() => {
          validateAvatarParams(undefined, rating as any);
        }).not.toThrow();
      });
    });

    test('should accept both valid parameters', () => {
      expect(() => {
        validateAvatarParams(150, 'pg');
      }).not.toThrow();
    });

    test('should accept no parameters', () => {
      expect(() => {
        validateAvatarParams();
      }).not.toThrow();
    });

    test('should reject size too small', () => {
      expect(() => {
        validateAvatarParams(0);
      }).toThrow(GravatarError);
    });

    test('should reject size too large', () => {
      expect(() => {
        validateAvatarParams(2049);
      }).toThrow(GravatarError);
    });

    test('should reject negative size', () => {
      expect(() => {
        validateAvatarParams(-10);
      }).toThrow(GravatarError);
    });

    test('should accept non-integer size (current implementation)', () => {
      // Current implementation only checks if it's a number, not if it's an integer
      expect(() => {
        validateAvatarParams(100.5);
      }).not.toThrow();
    });

    test('should reject string size', () => {
      expect(() => {
        validateAvatarParams('100' as any);
      }).toThrow(GravatarError);
    });

    test('should reject invalid rating', () => {
      expect(() => {
        validateAvatarParams(undefined, 'invalid' as any);
      }).toThrow(GravatarError);
    });

    test('should handle boundary sizes', () => {
      expect(() => {
        validateAvatarParams(1);
      }).not.toThrow();

      expect(() => {
        validateAvatarParams(2048);
      }).not.toThrow();
    });

    test('should throw GravatarError with correct code for invalid size', () => {
      try {
        validateAvatarParams(0);
      } catch (error) {
        expect(error).toBeInstanceOf(GravatarError);
        if (error instanceof GravatarError) {
          expect(error.code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
          expect(error.message).toContain('Avatar size');
        }
      }
    });

    test('should throw GravatarError with correct code for invalid rating', () => {
      try {
        validateAvatarParams(undefined, 'invalid' as any);
      } catch (error) {
        expect(error).toBeInstanceOf(GravatarError);
        if (error instanceof GravatarError) {
          expect(error.code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
          expect(error.message).toContain('Avatar rating');
        }
      }
    });
  });

  describe('getDefaultAvatarConfig', () => {
    test('should return correct default configuration', () => {
      const config = getDefaultAvatarConfig();

      expect(config.size).toBe(80);
      expect(config.rating).toBe('g');
      expect(config.default).toBe('mp');
      expect(config.forceDefault).toBe(false);
    });
  });
});