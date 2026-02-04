/**
 * Tests for GravatarClient advanced features
 */

import { describe, test, expect, beforeEach, afterEach, jest, type Mock } from 'bun:test';
import { GravatarClient } from '../GravatarClient.js';
import { GravatarError, GRAVATAR_ERROR_CODES } from '../types.js';
import type { GravatarProfile } from '../types';

// Mock fetch for testing
global.fetch = jest.fn() as any;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('GravatarClient', () => {
  let client: GravatarClient;
  let fetchMock: Mock<any>;

  beforeEach(() => {
    fetchMock = global.fetch as unknown as Mock<any>;
    fetchMock.mockClear();

    // Reset console methods
    console.error = jest.fn();
    console.warn = jest.fn();

    // Create client with test configuration
    client = new GravatarClient({
      apiKey: 'test-api-key',
      timeout: 5000,
      cache: {
        ttl: 60,
        maxSize: 10,
      },
      retry: {
        maxAttempts: 2,
        baseDelay: 100,
      },
    });
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  // ============================================================================
  // Basic Configuration Tests
  // ============================================================================

  test('should initialize with default configuration', () => {
    const defaultClient = new GravatarClient();
    const config = defaultClient.getConfig();

    expect(config.baseUrl).toBe('https://api.gravatar.com/v3');
    expect(config.timeout).toBe(10000);
    expect((defaultClient as any).config.cache?.enabled).toBe(true);
    expect((defaultClient as any).config.cache?.ttl).toBe(300000); // 5 minutes default
    expect((defaultClient as any).config.cache?.maxSize).toBe(100);
    expect((defaultClient as any).config.retry?.maxAttempts).toBe(3);
  });

  test('should merge configuration properly', () => {
    const customClient = new GravatarClient({
      apiKey: 'custom-key',
      baseUrl: 'https://custom.example.com',
      timeout: 15000,
      headers: {
        'X-Custom-Header': 'test-value',
      },
      cache: {
        ttl: 600,
        maxSize: 50,
      },
      retry: {
        maxAttempts: 5,
      },
    });

    const config = customClient.getConfig();
    expect(config.baseUrl).toBe('https://custom.example.com');
    expect(config.timeout).toBe(15000);
    expect(config.headers?.['X-Custom-Header']).toBe('test-value');
    expect((customClient as any).config.cache?.ttl).toBe(600000); // 10 minutes
    expect((customClient as any).config.cache?.maxSize).toBe(50);
    expect((customClient as any).config.retry?.maxAttempts).toBe(5);
  });

  test('should update configuration', () => {
    client.updateConfig({
      timeout: 20000,
      headers: {
        'X-New-Header': 'new-value',
      },
    });

    const config = client.getConfig();
    expect(config.timeout).toBe(20000);
    expect(config.headers?.['X-New-Header']).toBe('new-value');
  });

  // ============================================================================
  // Basic Profile Fetching Tests
  // ============================================================================

  test('should fetch profile successfully', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(mockProfile)));

    const result = await client.getProfile('test@example.com');

    expect(result).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/profiles/'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'User-Agent': 'astro-gravatar-client/1.0.0',
        }),
      })
    );
  });

  test('should use cache for subsequent requests', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(mockProfile)));

    // First request
    const result1 = await client.getProfile('test@example.com');
    expect(result1).toEqual(mockProfile);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second request should use cache
    const result2 = await client.getProfile('test@example.com');
    expect(result2).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Should not increase

    // Check cache stats
    const cacheStats = client.getCacheStats();
    expect(cacheStats.size).toBe(1);
    expect(cacheStats.hits).toBe(1);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  test('should handle API errors properly', async () => {
    fetchMock.mockImplementation(async () => new Response('Profile not found', {
      status: 404,
      statusText: 'Not Found',
    }));

    await expect(client.getProfile('nonexistent@example.com')).rejects.toThrow(GravatarError);
  });

  test('should handle network timeouts', async () => {
    fetchMock.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      });
    });

    // Override timeout for faster test
    client.updateConfig({ timeout: 50 });

    await expect(client.getProfile('test@example.com')).rejects.toThrow(GravatarError);
  });

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  test('should retry on network errors', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    // First call fails, second succeeds
    fetchMock
      .mockImplementationOnce(async () => Promise.reject(new Error('Network error')))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
        headers: new Headers(),
      } as Response);

    const result = await client.getProfile('test@example.com');
    expect(result).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const stats = client.getRequestStats();
    expect(stats.totalRetries).toBe(1);
  });

  test('should respect maximum retry attempts', async () => {
    fetchMock.mockImplementation(async () => Promise.reject(new Error('Persistent network error')));

    await expect(client.getProfile('test@example.com')).rejects.toThrow(GravatarError);
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  test('should not retry on authentication errors', async () => {
    fetchMock.mockImplementation(async () => new Response('Invalid API key', {
      status: 401,
      statusText: 'Unauthorized',
    }));

    await expect(client.getProfile('test@example.com')).rejects.toThrow(GravatarError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // Should not retry
  });

  // ============================================================================
  // Rate Limit Handling Tests
  // ============================================================================

  test('should handle rate limit with automatic backoff', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    const rateLimitHeaders = new Headers({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 1),
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
        headers: rateLimitHeaders,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
        headers: new Headers(),
      } as Response);

    const result = await client.getProfile('test@example.com');
    expect(result).toEqual(mockProfile);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // ============================================================================
  // Batch Processing Tests
  // ============================================================================

  test('should fetch multiple profiles in batch', async () => {
    const mockProfiles: GravatarProfile[] = [
      {
        hash: 'abc123',
        profile_url: 'https://gravatar.com/abc123',
        avatar_url: 'https://gravatar.com/avatar/abc123',
        avatar_alt_text: 'Avatar 1',
        display_name: 'User 1',
      },
      {
        hash: 'def456',
        profile_url: 'https://gravatar.com/def456',
        avatar_url: 'https://gravatar.com/avatar/def456',
        avatar_alt_text: 'Avatar 2',
        display_name: 'User 2',
      },
    ];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfiles[0],
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfiles[1],
        headers: new Headers(),
      } as Response);

    const results = await client.getProfiles(['user1@example.com', 'user2@example.com']);

    expect(results).toHaveLength(2);
    expect(results[0].profile).toEqual(mockProfiles[0]);
    expect(results[1].profile).toEqual(mockProfiles[1]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('should handle mixed success and failure in batch', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Profile not found',
        headers: new Headers(),
      } as Response);

    const results = await client.getProfiles(['success@example.com', 'fail@example.com']);

    expect(results).toHaveLength(2);
    expect(results[0].profile).toEqual(mockProfile);
    expect(results[0].error).toBeUndefined();
    expect(results[1].profile).toBeUndefined();
    expect(results[1].error).toBeInstanceOf(GravatarError);
  });

  test('should respect concurrency limits', async () => {
    // Create a client with low concurrency
    const batchClient = new GravatarClient({
      apiKey: 'test-key',
      retry: { maxAttempts: 1 }, // Disable retries for this test
    });

    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    // Track concurrent requests
    let concurrentCount = 0;
    let maxConcurrent = 0;

    fetchMock.mockImplementation(async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await new Promise(resolve => setTimeout(resolve, 50));
      concurrentCount--;
      return {
        ok: true,
        status: 200,
        json: async () => mockProfile,
        headers: new Headers(),
      } as Response;
    });

    const emails = Array.from({ length: 5 }, (_, i) => `user${i}@example.com`);
    await batchClient.getProfiles(emails, { concurrency: 2 });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  test('should manage cache size properly', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    // Create client with small cache
    const smallCacheClient = new GravatarClient({
      cache: {
        maxSize: 3,
        ttl: 300,
      },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProfile,
      headers: new Headers(),
    } as Response);

    // Fill cache beyond max size
    await smallCacheClient.getProfile('user1@example.com');
    await smallCacheClient.getProfile('user2@example.com');
    await smallCacheClient.getProfile('user3@example.com');
    await smallCacheClient.getProfile('user4@example.com');
    await smallCacheClient.getProfile('user5@example.com');

    const cacheStats = smallCacheClient.getCacheStats();
    expect(cacheStats.size).toBeLessThanOrEqual(3);
  });

  test('should clear cache', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProfile,
      headers: new Headers(),
    } as Response);

    await client.getProfile('test@example.com');
    expect(client.getCacheStats().size).toBe(1);

    client.clearCache();
    expect(client.getCacheStats().size).toBe(0);
  });

  test('should respect cache TTL', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProfile,
      headers: new Headers(),
    } as Response);

    // Create client with very short TTL
    const shortTtlClient = new GravatarClient({
      cache: {
        ttl: 0.1, // 100ms
        maxSize: 10,
      },
    });

    await shortTtlClient.getProfile('test@example.com');
    expect(shortTtlClient.getCacheStats().size).toBe(1);

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should make new request
    await shortTtlClient.getProfile('test@example.com');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // ============================================================================
  // Statistics and Monitoring Tests
  // ============================================================================

  test('should track request statistics', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(mockProfile)));

    await client.getProfile('test@example.com');
    await client.getProfile('test2@example.com');

    // Simulate a failure - client will retry once, so expect 2 requests
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Promise.reject(new Error('Network error')));
    try {
      await client.getProfile('fail@example.com');
    } catch {
      // Expected to fail after retry attempts
    }

    const stats = client.getRequestStats();
    expect(stats.totalRequests).toBeGreaterThan(3); // At least 3, plus retry attempts
    expect(stats.successfulRequests).toBe(2);
    expect(stats.failedRequests).toBe(1);
    expect(stats.totalRetries).toBeGreaterThan(0);
  });

  test('should provide comprehensive cache statistics', async () => {
    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(mockProfile)));

    await client.getProfile('test@example.com');
    await client.getProfile('test@example.com'); // From cache

    const stats = client.getCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(10);
    expect(stats.ttl).toBe(60);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRatio).toBe(0.5);
    expect(stats.entries).toHaveLength(1);
    expect(stats.entries[0].accessCount).toBe(2);
  });

  // ============================================================================
  // Advanced Configuration Tests
  // ============================================================================

  test('should use custom headers', async () => {
    const customClient = new GravatarClient({
      headers: {
        'X-Custom-Header': 'custom-value',
        'User-Agent': 'custom-agent/1.0',
      },
    });

    fetchMock.mockImplementation(async () => new Response('{}'));

    await customClient.getProfile('test@example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'custom-value',
          'User-Agent': 'custom-agent/1.0',
        }),
      })
    );
  });

  test('should handle disabled cache', async () => {
    const noCacheClient = new GravatarClient({
      cache: {
        enabled: false,
        ttl: 300,
        maxSize: 100,
      },
    });

    const mockProfile: GravatarProfile = {
      hash: 'abc123',
      profile_url: 'https://gravatar.com/abc123',
      avatar_url: 'https://gravatar.com/avatar/abc123',
      avatar_alt_text: 'Avatar',
      display_name: 'Test User',
    };

    fetchMock.mockImplementation(async () => new Response(JSON.stringify(mockProfile)));

    await noCacheClient.getProfile('test@example.com');
    await noCacheClient.getProfile('test@example.com');

    expect(fetchMock).toHaveBeenCalledTimes(2); // Should not use cache
    expect(noCacheClient.getCacheStats().size).toBe(0);
  });
});