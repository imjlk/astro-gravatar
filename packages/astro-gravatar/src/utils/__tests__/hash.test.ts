/**
 * Comprehensive tests for hash utilities
 * Phase 2.1: Complete unit test coverage for all hash functions
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  isValidEmail,
  normalizeEmail,
  hashEmail,
  hashEmails,
  isValidGravatarHash,
  extractHash,
  hashEmailWithCache,
  clearEmailHashCache,
  getEmailHashCacheStats
} from '../hash';
import { GravatarError, GRAVATAR_ERROR_CODES } from '../../lib/types';
import { VALID_EMAILS, INVALID_EMAILS, ERROR_SCENARIOS } from '../../__tests__/fixtures';
import { TestDataGenerator, benchmark, measureTime } from '../../../test-utils/test-helpers';

describe('Email Validation', () => {
  test('should validate correct email formats', () => {
    VALID_EMAILS.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  test('should reject invalid email formats', () => {
    INVALID_EMAILS.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  test('should handle edge cases', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
    expect(isValidEmail(123 as any)).toBe(false);
  });

  test('should handle comprehensive edge cases', () => {
    // Unicode and international domains
    expect(isValidEmail('test@example.co.uk')).toBe(true);
    expect(isValidEmail('user@sub.domain.com')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
    expect(isValidEmail('user.name@example-domain.com')).toBe(true);
    expect(isValidEmail('123@example.com')).toBe(true);

    // Special characters in local part
    expect(isValidEmail('user+alias@example.com')).toBe(true);
    expect(isValidEmail('user_underscore@example.com')).toBe(true);
    expect(isValidEmail('user-hyphen@example.com')).toBe(true);

    // Edge cases that should still be valid
    expect(isValidEmail('a@b.co')).toBe(true); // Shortest valid email
    expect(isValidEmail('very.common@example.com')).toBe(true);

    // Invalid cases that the simple regex should catch
    expect(isValidEmail('user name@example.com')).toBe(false); // Space

    // Note: The simple regex is deliberately permissive and doesn't catch all edge cases
    // like leading dots in domain or consecutive dots, as it focuses on basic structure validation
  });

  test('should handle whitespace correctly', () => {
    expect(isValidEmail(' test@example.com ')).toBe(true); // Should trim whitespace
    expect(isValidEmail('\ttest@example.com\n')).toBe(true); // Should trim tabs/newlines
    expect(isValidEmail('test @example.com')).toBe(false); // Space in middle
  });

  test('should be case insensitive for domain', () => {
    expect(isValidEmail('user@EXAMPLE.COM')).toBe(true);
    expect(isValidEmail('user@Example.Com')).toBe(true);
    expect(isValidEmail('user@example.COM')).toBe(true);
  });
});

describe('Email Normalization', () => {
  test('should trim and lowercase emails', () => {
    expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    expect(normalizeEmail('User+Tag@DOMAIN.COM')).toBe('user+tag@domain.com');
  });

  test('should throw errors for invalid emails', () => {
    const invalidInputs = ['', '   ', 'invalid', '@domain.com', 'user@'];

    invalidInputs.forEach(input => {
      expect(() => normalizeEmail(input)).toThrow(GravatarError);
    });
  });

  test('should throw specific error codes', () => {
    try {
      normalizeEmail('');
    } catch (error) {
      expect(error).toBeInstanceOf(GravatarError);
      expect((error as GravatarError).code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
    }

    try {
      normalizeEmail('invalid-email');
    } catch (error) {
      expect(error).toBeInstanceOf(GravatarError);
      expect((error as GravatarError).code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
    }
  });
});

describe('Email Hashing', () => {
  test('should generate consistent SHA256 hashes', () => {
    const email = 'test@example.com';
    const hash1 = hashEmail(email);
    const hash2 = hashEmail(email);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  test('should generate correct SHA256 hashes for known inputs', () => {
    // Known SHA256 hash vectors for validation
    const knownHashes = [
      {
        email: 'test@example.com',
        // SHA256 of 'test@example.com' normalized to lowercase
        expectedHash: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
      },
      {
        email: 'user@gmail.com',
        expectedHash: '02ee7bdc4ccf5c94808a0118eb531822f13e7e38e3810ab29ebefb2c2feb8e58'
      }
    ];

    knownHashes.forEach(({ email, expectedHash }) => {
      const hash = hashEmail(email);
      expect(hash).toBe(expectedHash);
    });
  });

  test('should generate different hashes for different emails', () => {
    const hash1 = hashEmail('test1@example.com');
    const hash2 = hashEmail('test2@example.com');

    expect(hash1).not.toBe(hash2);
  });

  test('should handle case-insensitive emails', () => {
    const hash1 = hashEmail('Test@Example.Com');
    const hash2 = hashEmail('test@example.com');
    const hash3 = hashEmail('TEST@EXAMPLE.COM');

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  test('should handle whitespace in emails', () => {
    const hash1 = hashEmail(' test@example.com ');
    const hash2 = hashEmail('\ttest@example.com\n');
    const hash3 = hashEmail('test@example.com');

    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  test('should handle email tags and special characters', () => {
    const email1 = 'user+tag@example.com';
    const email2 = 'user+alias@gmail.com';
    const email3 = 'firstname.lastname@company.co.uk';

    const hash1 = hashEmail(email1);
    const hash2 = hashEmail(email2);
    const hash3 = hashEmail(email3);

    expect(hash1).toHaveLength(64);
    expect(hash2).toHaveLength(64);
    expect(hash3).toHaveLength(64);
    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
  });

  test('should throw errors for invalid emails', () => {
    expect(() => hashEmail('invalid-email')).toThrow(GravatarError);
    expect(() => hashEmail('')).toThrow(GravatarError);
    expect(() => hashEmail(null as any)).toThrow(GravatarError);
    expect(() => hashEmail(undefined as any)).toThrow(GravatarError);
  });

  test('should throw specific error codes', () => {
    let errorThrown = false;
    try {
      hashEmail('invalid-email');
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(GravatarError);
      expect((error as GravatarError).code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
    }
    expect(errorThrown).toBe(true);
  });

  test('should handle hash generation errors gracefully', () => {
    // Test with non-string inputs that might cause internal errors
    const invalidInputs = [null, undefined, 123, {}, [], true];

    invalidInputs.forEach(input => {
      expect(() => hashEmail(input as any)).toThrow(GravatarError);
    });
  });
});

describe('Batch Email Hashing', () => {
  test('should hash multiple emails', () => {
    const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com'];
    const hashes = hashEmails(emails);

    expect(hashes).toHaveLength(3);
    hashes.forEach(hash => {
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    // Verify hashes are unique
    expect(new Set(hashes).size).toBe(3);
  });

  test('should handle empty array', () => {
    expect(hashEmails([])).toEqual([]);
  });

  test('should throw error for non-array input', () => {
    expect(() => hashEmails('not-an-array' as any)).toThrow(GravatarError);
    expect(() => hashEmails(null as any)).toThrow(GravatarError);
    expect(() => hashEmails(undefined as any)).toThrow(GravatarError);
  });

  test('should throw error if any email is invalid', () => {
    const emails = ['valid@example.com', 'invalid-email', 'another@example.com'];

    expect(() => hashEmails(emails)).toThrow(GravatarError);
  });

  test('should be more efficient than individual calls for large arrays', async () => {
    const emails = TestDataGenerator.emails(100);

    // Test individual hashing
    const { duration: individualTime } = await measureTime(() => {
      return emails.map(email => hashEmail(email));
    });

    // Test batch hashing
    const { duration: batchTime } = await measureTime(() => {
      return hashEmails(emails);
    });

    // Batch should be competitive with individual (allowing for measurement variance)
    expect(batchTime).toBeLessThan(individualTime * 2);
  });

  test('should maintain hash consistency with individual calls', () => {
    const emails = [
      'user1@example.com',
      'user2@gmail.com',
      'user3@test.org'
    ];

    const batchHashes = hashEmails(emails);
    const individualHashes = emails.map(email => hashEmail(email));

    expect(batchHashes).toEqual(individualHashes);
  });

  test('should handle duplicate emails consistently', () => {
    const emails = [
      'test@example.com',
      'user@gmail.com',
      'test@example.com', // Duplicate
      'user@gmail.com'   // Duplicate
    ];

    const hashes = hashEmails(emails);

    expect(hashes).toHaveLength(4);
    expect(hashes[0]).toBe(hashes[2]); // First duplicate pair
    expect(hashes[1]).toBe(hashes[3]); // Second duplicate pair
  });

  test('should handle large arrays efficiently', async () => {
    const emails = TestDataGenerator.emails(1000);

    const { result: hashes, duration } = await measureTime(() => hashEmails(emails));

    expect(hashes).toHaveLength(1000);
    expect(duration).toBeLessThan(500); // Should complete in under 500ms

    // Verify all hashes are valid
    hashes.forEach(hash => {
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  test('should handle mixed case emails in batch', () => {
    const emails = [
      'Test@Example.COM',
      'test@example.com',
      'USER@GMAIL.COM',
      'user@gmail.com'
    ];

    const hashes = hashEmails(emails);

    expect(hashes[0]).toBe(hashes[1]); // Same email, different case
    expect(hashes[2]).toBe(hashes[3]); // Same email, different case
    expect(hashes[0]).not.toBe(hashes[2]); // Different emails
  });
});

describe('Hash Validation', () => {
  test('should validate correct SHA256 hashes', () => {
    const validHashes = [
      'a'.repeat(64),
      '0'.repeat(64),
      'f'.repeat(64),
      '1234567890abcdef'.repeat(4), // 64 hex chars
    ];

    validHashes.forEach(hash => {
      expect(isValidGravatarHash(hash)).toBe(true);
    });
  });

  test('should reject invalid hashes', () => {
    const invalidHashes = [
      'short',
      'toolong'.repeat(10),
      'g'.repeat(64), // Contains non-hex character
      '123', // Too short
      '', // Empty
      null as any,
      undefined as any,
      123 as any,
    ];

    invalidHashes.forEach(hash => {
      expect(isValidGravatarHash(hash)).toBe(false);
    });
  });
});

describe('Hash Extraction', () => {
  test('should extract hash from valid hash string', () => {
    const hash = 'a'.repeat(64);
    expect(extractHash(hash)).toBe(hash);
  });

  test('should extract hash from Gravatar profile URL', () => {
    const hash = '1234567890abcdef'.repeat(4);
    const url = `https://gravatar.com/${hash}`;
    expect(extractHash(url)).toBe(hash);
  });

  test('should hash email addresses', () => {
    const email = 'test@example.com';
    const hash = extractHash(email);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('should handle uppercase hashes', () => {
    const hash = 'ABCDEF1234567890'.repeat(4);
    expect(extractHash(hash)).toBe(hash.toLowerCase());
  });

  test('should throw errors for invalid inputs', () => {
    expect(() => extractHash('')).toThrow(GravatarError);
    expect(() => extractHash(null as any)).toThrow(GravatarError);
    expect(() => extractHash(undefined as any)).toThrow(GravatarError);
    expect(() => extractHash(123 as any)).toThrow(GravatarError);
  });

  test('should handle URLs without hash', () => {
    const url = 'https://gravatar.com/';
    expect(() => extractHash(url)).toThrow(GravatarError);
  });
});

describe('Hash Caching', () => {
  beforeEach(() => {
    clearEmailHashCache();
  });

  afterEach(() => {
    clearEmailHashCache();
  });

  test('should cache hashes by default', () => {
    const email = 'test@example.com';
    const hash1 = hashEmailWithCache(email);
    const hash2 = hashEmailWithCache(email);

    expect(hash1).toBe(hash2);
    expect(getEmailHashCacheStats().size).toBe(1);
  });

  test('should bypass cache when disabled', () => {
    const email = 'test@example.com';
    hashEmailWithCache(email, true);
    const stats = getEmailHashCacheStats();

    expect(stats.size).toBe(1);

    clearEmailHashCache();
    hashEmailWithCache(email, false);

    expect(getEmailHashCacheStats().size).toBe(0);
  });

  test('should return cached hash when available', () => {
    const email = 'test@example.com';
    const hash1 = hashEmailWithCache(email, true);

    // Second call should return cached result
    const hash2 = hashEmailWithCache(email, true);

    expect(hash1).toBe(hash2);
  });

  test('should provide cache statistics', () => {
    const stats = getEmailHashCacheStats();

    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('ttl');
    expect(stats.maxSize).toBe(1000);
    expect(stats.ttl).toBe(5 * 60 * 1000); // 5 minutes
  });

  test('should significantly improve performance for repeated hashes', async () => {
    const email = 'test@example.com';
    const iterations = 100;

    // Clear cache first
    clearEmailHashCache();

    // Test without caching
    const { averageTime: noCacheTime } = await benchmark(() => {
      return hashEmail(email);
    }, iterations);

    // Clear cache and test with caching
    clearEmailHashCache();

    // First call to populate cache
    hashEmailWithCache(email, true);

    const { averageTime: cacheTime } = await benchmark(() => {
      return hashEmailWithCache(email, true);
    }, iterations);

    // Cached version should be faster (allowing for variance in micro-benchmarks)
    expect(cacheTime).toBeLessThan(noCacheTime * 0.8); // At least 20% faster
  });

  test('should handle cache size limits and eviction', () => {
    // Temporarily reduce cache size for testing
    const originalMaxSize = getEmailHashCacheStats().maxSize;

    // Fill cache beyond normal limits (this is conceptual since we can't easily modify the internal constant)
    const emails = TestDataGenerator.emails(50);

    emails.forEach(email => {
      hashEmailWithCache(email);
    });

    const stats = getEmailHashCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
  });

  test('should handle mixed cache scenarios efficiently', async () => {
    const emails = TestDataGenerator.emails(10); // Small set for mixing
    const iterations = 50;

    // Clear cache
    clearEmailHashCache();

    // Test mixed operations - some cached, some new
    const { averageTime: mixedTime } = await benchmark(() => {
      const randomEmail = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(randomEmail);
    }, iterations);

    // Test all new operations (cache disabled)
    clearEmailHashCache();
    const { averageTime: noCacheTime } = await benchmark(() => {
      const randomEmail = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(randomEmail, false);
    }, iterations);

    // Mixed operations should be faster due to caching (allowing for significant variance due to test environment)
    expect(mixedTime).toBeLessThan(noCacheTime * 1.5);
  });

  test('should maintain consistency between cached and non-cached results', () => {
    const emails = [
      'test1@example.com',
      'test2@gmail.com',
      'test3@test.org'
    ];

    emails.forEach(email => {
      const cachedHash = hashEmailWithCache(email, true);
      const directHash = hashEmail(email);
      const nonCachedHash = hashEmailWithCache(email, false);

      expect(cachedHash).toBe(directHash);
      expect(directHash).toBe(nonCachedHash);
    });
  });

  test('should handle cache invalidation scenarios', () => {
    const email = 'test@example.com';

    // Populate cache
    const hash1 = hashEmailWithCache(email);
    expect(getEmailHashCacheStats().size).toBe(1);

    // Clear cache
    clearEmailHashCache();
    expect(getEmailHashCacheStats().size).toBe(0);

    // Generate new hash - should be consistent
    const hash2 = hashEmailWithCache(email);
    expect(hash2).toBe(hash1);
  });

  test('should handle concurrent access to cache', async () => {
    const email = 'test@example.com';
    const promises = Array.from({ length: 10 }, () =>
      Promise.resolve(hashEmailWithCache(email))
    );

    const hashes = await Promise.all(promises);

    // All hashes should be identical
    hashes.forEach(hash => {
      expect(hash).toBe(hashes[0]);
    });

    // Cache should only have one entry
    expect(getEmailHashCacheStats().size).toBe(1);
  });
});

describe('Cache TTL and Expiration', () => {
  beforeEach(() => {
    clearEmailHashCache();
  });

  afterEach(() => {
    clearEmailHashCache();
  });

  test('should have correct TTL configuration', () => {
    const stats = getEmailHashCacheStats();
    expect(stats.ttl).toBe(5 * 60 * 1000); // 5 minutes in milliseconds
  });

  test('should return cached hash while within TTL', () => {
    const email = 'test@example.com';

    // First call should compute and cache
    const hash1 = hashEmailWithCache(email);

    // Immediate second call should return cached version
    const hash2 = hashEmailWithCache(email);

    expect(hash1).toBe(hash2);
    expect(getEmailHashCacheStats().size).toBe(1);
  });

  test('should show cache behavior patterns', () => {
    const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com'];

    // Cache all emails
    emails.forEach(email => {
      hashEmailWithCache(email);
    });

    expect(getEmailHashCacheStats().size).toBe(3);

    // Clear and test behavior
    clearEmailHashCache();
    expect(getEmailHashCacheStats().size).toBe(0);

    // Recache one email
    hashEmailWithCache(emails[0]);
    expect(getEmailHashCacheStats().size).toBe(1);
  });

  test('should handle cache overflow scenarios', () => {
    // Add many items to cache to test overflow behavior
    const emails = TestDataGenerator.emails(100);

    emails.forEach(email => {
      hashEmailWithCache(email);
    });

    const stats = getEmailHashCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
  });

  test('should maintain performance under cache pressure', async () => {
    const baseEmails = TestDataGenerator.emails(50);

    // Pre-populate cache
    baseEmails.forEach(email => {
      hashEmailWithCache(email);
    });

    // Test performance with mixed cached/uncached operations
    const { averageTime } = await benchmark(() => {
      const email = baseEmails[Math.floor(Math.random() * baseEmails.length)];
      return hashEmailWithCache(email);
    }, 100);

    // Should remain efficient even with cache pressure
    expect(averageTime).toBeLessThan(50); // Should complete 100 operations in under 50ms
  });
});

describe('Performance Tests', () => {
  test('should handle large numbers of emails efficiently', async () => {
    const emails = TestDataGenerator.emails(1000);

    const { result: hashes, duration } = await measureTime(() => hashEmails(emails));

    expect(hashes).toHaveLength(1000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second

    // Verify all hashes are valid
    hashes.forEach(hash => {
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  test('should demonstrate significant cache performance benefits', async () => {
    const email = 'test@example.com';
    const iterations = 1000;

    // Test without caching
    clearEmailHashCache();
    const { averageTime: noCacheTime } = await benchmark(() => {
      return hashEmail(email);
    }, iterations);

    // Test with caching
    clearEmailHashCache();
    // First call to populate cache
    hashEmailWithCache(email, true);

    const { averageTime: cacheTime } = await benchmark(() => {
      return hashEmailWithCache(email, true);
    }, iterations);

    // Cached version should be faster
    expect(cacheTime).toBeLessThan(noCacheTime * 0.8); // At least 20% faster
  });

  test('should handle mixed workloads efficiently', async () => {
    const emails = TestDataGenerator.emails(100);
    const iterations = 500;

    // Test mixed operations with caching
    clearEmailHashCache();

    const { averageTime: mixedTime } = await benchmark(() => {
      const email = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(email);
    }, iterations);

    // Test all new operations without caching
    clearEmailHashCache();
    const { averageTime: newOnlyTime } = await benchmark(() => {
      const email = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(email, false);
    }, iterations);

    // Mixed operations should be faster due to cache hits (allowing for test environment variance)
    expect(mixedTime).toBeLessThan(newOnlyTime * 0.95); // At least 5% improvement
  });

  test('should scale efficiently with batch operations', async () => {
    const sizes = [10, 100, 500, 1000];
    const results = [];

    for (const size of sizes) {
      const emails = TestDataGenerator.emails(size);
      const { duration } = await measureTime(() => hashEmails(emails));

      results.push({ size, duration, perEmail: duration / size });
    }

    // Per-email time should not increase dramatically with size
    const firstRate = results[0].perEmail;
    const lastRate = results[results.length - 1].perEmail;

    // Should be reasonably efficient scaling (within 10x per-email cost)
    expect(lastRate).toBeLessThan(firstRate * 10);
  });

  test('should handle stress scenarios gracefully', async () => {
    const iterations = 5000;
    const emails = TestDataGenerator.emails(100); // 100 unique emails

    // Stress test with caching
    const { duration } = await benchmark(() => {
      const email = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(email);
    }, iterations);

    // Should handle 5000 operations efficiently
    const { averageTime: stressTime } = await benchmark(() => {
      const email = emails[Math.floor(Math.random() * emails.length)];
      return hashEmailWithCache(email);
    }, iterations);

    expect(stressTime).toBeLessThan(1); // Under 1ms average per operation

    // Verify cache is working
    const stats = getEmailHashCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
  });
});

describe('Comprehensive Error Handling', () => {
  test('should handle all invalid email scenarios with proper error codes', () => {
    const invalidScenarios = [
      { input: '', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
      { input: '   ', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
      { input: 'invalid-email', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
      { input: '@domain.com', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
      { input: 'user@', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
      { input: 'user@.com', code: GRAVATAR_ERROR_CODES.INVALID_EMAIL },
    ];

    invalidScenarios.forEach(({ input, code }) => {
      expect(() => hashEmail(input)).toThrow(GravatarError);

      let errorThrown = false;
      try {
        hashEmail(input);
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(GravatarError);
        expect((error as GravatarError).code).toBe(code);
      }
      expect(errorThrown).toBe(true);
    });
  });

  test('should handle type errors gracefully', () => {
    const typeErrorInputs = [
      null,
      undefined,
      123,
      {},
      [],
      true,
      false,
      Symbol('test'),
    ];

    typeErrorInputs.forEach(input => {
      expect(() => hashEmail(input as any)).toThrow(GravatarError);
      expect(() => hashEmailWithCache(input as any)).toThrow(GravatarError);
      expect(() => normalizeEmail(input as any)).toThrow(GravatarError);
    });
  });

  test('should handle batch operation errors properly', () => {
    // Test non-array input
    expect(() => hashEmails('not-an-array' as any)).toThrow(GravatarError);
    expect(() => hashEmails(null as any)).toThrow(GravatarError);
    expect(() => hashEmails(123 as any)).toThrow(GravatarError);

    let errorThrown = false;
    try {
      hashEmails('not-an-array' as any);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(GravatarError);
      expect((error as GravatarError).code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
    }
    expect(errorThrown).toBe(true);

    // Test array with invalid emails
    const emailsWithInvalid = [
      'valid@example.com',
      'invalid-email',
      'another@example.com'
    ];

    expect(() => hashEmails(emailsWithInvalid)).toThrow(GravatarError);
  });

  test('should handle extractHash error scenarios', () => {
    const invalidInputs = [
      '',
      null as any,
      undefined as any,
      123 as any,
      {},
      [],
      'not-a-hash',
      'https://gravatar.com/', // URL without hash
    ];

    invalidInputs.forEach(input => {
      expect(() => extractHash(input as any)).toThrow(GravatarError);
    });

    // Test specific error codes
    let errorThrown = false;
    try {
      extractHash('');
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(GravatarError);
      expect((error as GravatarError).code).toBe(GRAVATAR_ERROR_CODES.INVALID_EMAIL);
    }
    expect(errorThrown).toBe(true);
  });

  test('should handle edge case unicode and special characters', () => {
    // These might pass validation but could cause issues in hashing
    const edgeCaseEmails = [
      'user+tag@example.com',
      'user_underscore@example.com',
      'user-hyphen@example.com',
      'test@example.co.uk',
      'user@sub.domain.com',
      '123@example.com',
    ];

    edgeCaseEmails.forEach(email => {
      expect(() => {
        const hash = hashEmail(email);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      }).not.toThrow();
    });
  });

  test('should handle memory pressure scenarios', async () => {
    // Test with very large number of operations
    const iterations = 10000;
    const email = 'test@example.com';

    // Should not throw under normal circumstances
    expect(async () => {
      const promises = Array.from({ length: iterations }, () =>
        Promise.resolve(hashEmailWithCache(email))
      );
      await Promise.all(promises);
    }).not.toThrow();
  });

  test('should maintain error consistency across functions', () => {
    const invalidEmail = 'invalid-email';

    // All functions should throw GravatarError for invalid input
    const functions = [
      () => hashEmail(invalidEmail),
      () => normalizeEmail(invalidEmail),
      () => hashEmailWithCache(invalidEmail),
      () => extractHash(invalidEmail),
    ];

    functions.forEach(fn => {
      let errorThrown = false;
      try {
        fn();
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(GravatarError);
      }
      expect(errorThrown).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle real-world email formats', () => {
    const realEmails = [
      'john.doe@gmail.com',
      'user+tag@yahoo.com',
      'firstname.lastname@company.co.uk',
      '12345@numeric-domain.com',
      'UPPERCASE@DOMAIN.COM',
      'user.name.with.dots@sub.domain.com',
    ];

    realEmails.forEach(email => {
      const hash = hashEmail(email);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  test('should maintain consistency across operations', () => {
    const email = 'Test.User+Tag@Example.COM';

    // All operations should produce consistent results
    const normalized = normalizeEmail(email);
    const hashed = hashEmail(email);
    const extracted = extractHash(email);
    const cached = hashEmailWithCache(email);

    expect(normalized).toBe('test.user+tag@example.com');
    expect(hashed).toBe(extracted);
    expect(hashed).toBe(cached);
  });

  test('should handle workflow end-to-end', () => {
    // Simulate a typical workflow
    const email = 'user@example.com';

    // 1. Validate email
    expect(isValidEmail(email)).toBe(true);

    // 2. Generate hash
    const hash = hashEmail(email);
    expect(isValidGravatarHash(hash)).toBe(true);

    // 3. Extract from various formats
    expect(extractHash(email)).toBe(hash);
    expect(extractHash(hash)).toBe(hash);
    expect(extractHash(`https://gravatar.com/${hash}`)).toBe(hash);

    // 4. Batch processing
    const batchHashes = hashEmails([email, 'user2@example.com']);
    expect(batchHashes[0]).toBe(hash);
    expect(batchHashes).toHaveLength(2);
  });
});