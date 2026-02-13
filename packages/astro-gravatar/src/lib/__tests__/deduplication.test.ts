/**
 * Tests for RequestDeduplicator utility
 * Following TDD: These tests define the expected behavior
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { createRequestDeduplicator, type RequestDeduplicator } from '../deduplication.js';

describe('RequestDeduplicator', () => {
  describe('factory function', () => {
    test('creates a new deduplicator instance with default TTL (5000ms)', () => {
      const deduplicator = createRequestDeduplicator();
      expect(deduplicator).toBeDefined();
      expect(typeof deduplicator.deduplicate).toBe('function');
      expect(typeof deduplicator.clear).toBe('function');
    });

    test('creates a new deduplicator instance with custom TTL', () => {
      const deduplicator = createRequestDeduplicator(10000);
      expect(deduplicator).toBeDefined();
    });

    test('creates independent instances (not global singleton)', () => {
      const deduplicator1 = createRequestDeduplicator();
      const deduplicator2 = createRequestDeduplicator();
      expect(deduplicator1).not.toBe(deduplicator2);
    });
  });

  describe('deduplicate', () => {
    let deduplicator: RequestDeduplicator;

    beforeEach(() => {
      deduplicator = createRequestDeduplicator(5000);
    });

    test('executes function and returns result for unique key', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const result = await deduplicator.deduplicate('key1', fn);
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('deduplicates simultaneous requests with same key (single API call)', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `result-${callCount}`;
      });

      // Simultaneous calls with same key
      const [result1, result2, result3] = await Promise.all([
        deduplicator.deduplicate('same-key', fn),
        deduplicator.deduplicate('same-key', fn),
        deduplicator.deduplicate('same-key', fn),
      ]);

      // All should return the same result
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      // Function should only be called once (deduplication)
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('executes separate calls for different keys', async () => {
      const fn = vi.fn().mockImplementation(async (key: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `result-for-${key}`;
      });

      const results = await Promise.all([
        deduplicator.deduplicate('key1', () => fn('key1')),
        deduplicator.deduplicate('key2', () => fn('key2')),
        deduplicator.deduplicate('key3', () => fn('key3')),
      ]);

      expect(results[0]).toBe('result-for-key1');
      expect(results[1]).toBe('result-for-key2');
      expect(results[2]).toBe('result-for-key3');
      // Each key should have its own call
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('propagates errors to all waiting callers', async () => {
      const error = new Error('API failed');
      const fn = vi.fn().mockRejectedValue(error);

      const promises = [
        deduplicator.deduplicate('error-key', fn),
        deduplicator.deduplicate('error-key', fn),
        deduplicator.deduplicate('error-key', fn),
      ];

      await Promise.all(
        promises.map((p) => p.then(() => expect.unreachable()).catch((e) => expect(e).toBe(error)))
      );

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('allows new call after TTL expires', async () => {
      vi.useFakeTimers();

      const deduplicatorWithShortTTL = createRequestDeduplicator(100);
      const fn = vi.fn().mockResolvedValue('result');

      // First call
      await deduplicatorWithShortTTL.deduplicate('ttl-key', fn);
      expect(fn).toHaveBeenCalledTimes(1);

      // Within TTL - should still deduplicate
      const promise1 = deduplicatorWithShortTTL.deduplicate('ttl-key', fn);
      vi.advanceTimersByTime(50);
      await promise1;
      expect(fn).toHaveBeenCalledTimes(1); // Still 1, deduplicated

      // After TTL expires - should allow new call
      vi.advanceTimersByTime(100);
      await deduplicatorWithShortTTL.deduplicate('ttl-key', fn);
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    test('clears in-flight promise after completion (allows re-call)', async () => {
      const noTtlDeduplicator = createRequestDeduplicator(0);
      const fn = vi.fn().mockResolvedValue('result');

      await noTtlDeduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(1);

      await noTtlDeduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('uses cached result within TTL', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(1);

      await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('works with typed results', async () => {
      interface UserProfile {
        id: number;
        name: string;
      }

      const profile: UserProfile = { id: 1, name: 'Test User' };
      const fn = vi.fn().mockResolvedValue(profile);

      const result = await deduplicator.deduplicate<UserProfile>('profile-key', fn);
      expect(result).toEqual(profile);
    });
  });

  describe('clear', () => {
    test('clears all cached results', async () => {
      const deduplicator = createRequestDeduplicator(10000);
      const fn = vi.fn().mockResolvedValue('result');

      await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(1);

      deduplicator.clear();

      // Should make a new call after clear
      await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('clears in-flight promises', async () => {
      const deduplicator = createRequestDeduplicator(10000);
      const resolvers: Array<(value: string) => void> = [];
      const fn = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvers.push(resolve);
          })
      );

      const promise1 = deduplicator.deduplicate('inflight-key', fn);

      deduplicator.clear();

      resolvers[0]!('first-result');
      await promise1;

      const promise2 = deduplicator.deduplicate('inflight-key', fn);
      resolvers[1]!('second-result');
      const result2 = await promise2;

      expect(fn).toHaveBeenCalledTimes(2);
      expect(result2).toBe('second-result');
    });
  });

  describe('SSR safety (request-scoped instances)', () => {
    test('separate instances do not share state', async () => {
      const deduplicator1 = createRequestDeduplicator();
      const deduplicator2 = createRequestDeduplicator();

      const fn1 = vi.fn().mockResolvedValue('result1');
      const fn2 = vi.fn().mockResolvedValue('result2');

      // Request 1 uses deduplicator1
      await deduplicator1.deduplicate('shared-key', fn1);

      // Request 2 uses deduplicator2 - should not be affected by request 1
      await deduplicator2.deduplicate('shared-key', fn2);

      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1); // Not deduplicated across instances
    });

    test('clearing one instance does not affect another', async () => {
      const deduplicator1 = createRequestDeduplicator();
      const deduplicator2 = createRequestDeduplicator();

      const fn = vi.fn().mockResolvedValue('result');

      await deduplicator1.deduplicate('key', fn);
      await deduplicator2.deduplicate('key', fn);

      // Clear only deduplicator1
      deduplicator1.clear();

      // deduplicator2 should still have its state
      await deduplicator2.deduplicate('key', fn);

      expect(fn).toHaveBeenCalledTimes(2); // 2 calls (deduplicator2 deduplicated second call)
    });
  });

  describe('edge cases', () => {
    test('handles null result', async () => {
      const deduplicator = createRequestDeduplicator();
      const fn = vi.fn().mockResolvedValue(null);

      const result = await deduplicator.deduplicate('null-key', fn);
      expect(result).toBeNull();
    });

    test('handles undefined result', async () => {
      const deduplicator = createRequestDeduplicator();
      const fn = vi.fn().mockResolvedValue(undefined);

      const result = await deduplicator.deduplicate('undefined-key', fn);
      expect(result).toBeUndefined();
    });

    test('handles empty string key', async () => {
      const deduplicator = createRequestDeduplicator();
      const fn = vi.fn().mockResolvedValue('result');

      const result = await deduplicator.deduplicate('', fn);
      expect(result).toBe('result');
    });

    test('handles concurrent deduplicate calls with same key during TTL', async () => {
      const deduplicator = createRequestDeduplicator(10000);
      let callCount = 0;

      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return `call-${callCount}`;
      });

      const batch1 = Promise.all([
        deduplicator.deduplicate('concurrent-key', fn),
        deduplicator.deduplicate('concurrent-key', fn),
      ]);

      const results1 = await batch1;
      expect(results1[0]).toBe(results1[1]);
      expect(fn).toHaveBeenCalledTimes(1);

      const results2 = await Promise.all([
        deduplicator.deduplicate('concurrent-key', fn),
        deduplicator.deduplicate('concurrent-key', fn),
      ]);
      expect(results2[0]).toBe(results2[1]);
      expect(results2[0]).toBe(results1[0]);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('makes new call after cache expires', async () => {
      vi.useFakeTimers();

      const deduplicator = createRequestDeduplicator(100);
      let callCount = 0;

      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return `call-${callCount}`;
      });

      const result1 = await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);

      const result2 = await deduplicator.deduplicate('key', fn);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result2).not.toBe(result1);

      vi.useRealTimers();
    });

    test('handles zero TTL (always allow new calls)', async () => {
      const deduplicator = createRequestDeduplicator(0);
      const fn = vi.fn().mockResolvedValue('result');

      await deduplicator.deduplicate('zero-ttl-key', fn);
      await deduplicator.deduplicate('zero-ttl-key', fn);

      // With 0 TTL, each call should be independent
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
