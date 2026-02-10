import { describe, it, expect } from "bun:test";
// @ts-ignore - Module doesn't exist yet
import * as Constants from "../constants";

describe("Constants Module", () => {
  it("should export all required constants", () => {
    // Avatar constants
    expect(Constants.MIN_AVATAR_SIZE).toBe(1);
    expect(Constants.MAX_AVATAR_SIZE).toBe(2048);
    expect(Constants.DEFAULT_AVATAR_SIZE).toBe(80);
    
    // QR constants
    expect(Constants.QR_MIN_SIZE).toBe(1);
    expect(Constants.QR_MAX_SIZE).toBe(1000);
    expect(Constants.DEFAULT_QR_SIZE).toBe(80);
    
    // Timeout and Caching
    expect(Constants.DEFAULT_TIMEOUT_MS).toBe(10000);
    expect(Constants.DEFAULT_CACHE_TTL_SECONDS).toBe(300);
    expect(Constants.DEFAULT_CACHE_MAX_SIZE).toBe(100);
    expect(Constants.CACHE_TTL_MS).toBe(300000); // 5 * 60 * 1000
    
    // Retry configuration
    expect(Constants.DEFAULT_RETRY_MAX_ATTEMPTS).toBe(3);
    expect(Constants.DEFAULT_RETRY_BASE_DELAY_MS).toBe(1000);
    expect(Constants.DEFAULT_RETRY_MAX_DELAY_MS).toBe(10000);
    expect(Constants.DEFAULT_BACKOFF_FACTOR).toBe(2);
    expect(Constants.RETRY_INTERVAL_MS).toBe(50);
    
    // Rate limiting
    expect(Constants.DEFAULT_SAFETY_BUFFER).toBe(0.1);
    expect(Constants.DEFAULT_RATE_LIMIT_MAX_CONCURRENT).toBe(10);
    expect(Constants.DEFAULT_CONCURRENCY).toBe(10);
    
    // Misc
    expect(Constants.USER_AGENT).toBe('astro-gravatar/1.0.0');
  });
});
