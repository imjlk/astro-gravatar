/**
 * Advanced Gravatar client with enterprise-level features
 * Provides configurable API client with caching, retry logic, and rate limiting
 */

import type {
  GravatarProfile,
  GravatarClientConfig,
  GravatarApiResponse,
  RateLimitInfo,
} from './types.js'; // Import types
import { GravatarError, GRAVATAR_ERROR_CODES } from './types.js'; // Import values

import type {
  CacheEntry,
  CacheOptions,
} from './types.js';
import { hashEmailWithCache } from '../utils/hash.js';
import {
  GRAVATAR_API_BASE,
  DEFAULT_TIMEOUT,
  buildProfileUrl
} from './gravatar.js';
import {
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_CACHE_MAX_SIZE,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_RETRY_MAX_DELAY_MS,
  DEFAULT_BACKOFF_FACTOR,
  DEFAULT_SAFETY_BUFFER,
  DEFAULT_RATE_LIMIT_MAX_CONCURRENT,
  DEFAULT_CONCURRENCY,
  RETRY_INTERVAL_MS
} from '../constants.js';

// ============================================================================
// Interfaces
// ============================================================================

/** Enhanced client configuration with advanced options */
export interface GravatarClientOptions extends GravatarClientConfig {
  /** Cache configuration */
  cache?: {
    /** Time-to-live in seconds (default: 300) */
    ttl?: number;
    /** Maximum number of cached items (default: 100) */
    maxSize?: number;
    /** Whether to enable caching (default: true) */
    enabled?: boolean;
  };
  /** Retry configuration */
  retry?: {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Base delay in milliseconds (default: 1000) */
    baseDelay?: number;
    /** Maximum delay in milliseconds (default: 10000) */
    maxDelay?: number;
    /** Exponential backoff factor (default: 2) */
    backoffFactor?: number;
    /** Whether to retry on rate limit errors (default: true) */
    retryOnRateLimit?: boolean;
  };
  /** Rate limit handling */
  rateLimit?: {
    /** Whether to automatically handle rate limits (default: true) */
    autoHandle?: boolean;
    /** Additional buffer to add to rate limits (default: 0.1 = 10%) */
    safetyBuffer?: number;
    /** Maximum concurrent requests (default: 10) */
    maxConcurrent?: number;
  };
}

/** Batch request options */
export interface BatchOptions {
  /** Maximum concurrent requests (default: 10) */
  concurrency?: number;
  /** Whether to fail fast on first error (default: false) */
  failFast?: boolean;
  /** Delay between batches in milliseconds (default: 0) */
  batchDelay?: number;
}

/** Client cache statistics */
export interface ClientCacheStats {
  /** Total number of cached entries */
  size: number;
  /** Maximum cache size */
  maxSize: number;
  /** Cache TTL in seconds */
  ttl: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Cache hit ratio */
  hitRatio: number;
  /** Cache entries with expiration info */
  entries: Array<{
    key: string;
    expires: number;
    accessCount: number;
    lastAccess: number;
  }>;
}

/** Client request statistics */
export interface ClientRequestStats {
  /** Total number of requests made */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Number of cache misses */
  cacheMisses: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Number of retries attempted */
  totalRetries: number;
  /** Current rate limit information */
  currentRateLimit?: RateLimitInfo;
}

// ============================================================================
// GravatarClient Implementation
// ============================================================================

/**
 * Advanced Gravatar API client with enterprise features
 *
 * Features:
 * - Configurable caching with TTL and size limits
 * - Exponential backoff retry logic
 * - Advanced rate limit handling
 * - Custom base URLs and headers
 * - Timeout handling
 * - Request statistics and monitoring
 * - Batch processing with concurrency control
 */
export class GravatarClient {
  private config: Required<GravatarClientOptions>;
  private cache: Map<string, CacheEntry>;
  private stats: ClientRequestStats;
  private currentRequests: number = 0; // Track concurrent requests

  // Default configuration
  private static readonly DEFAULTS: Required<GravatarClientOptions> = {
    apiKey: '',
    baseUrl: GRAVATAR_API_BASE,
    timeout: DEFAULT_TIMEOUT,
    headers: {},
    cache: {
      ttl: DEFAULT_CACHE_TTL_SECONDS, // 5 minutes
      maxSize: DEFAULT_CACHE_MAX_SIZE,
      enabled: true,
    },
    retry: {
      maxAttempts: DEFAULT_RETRY_MAX_ATTEMPTS,
      baseDelay: DEFAULT_RETRY_BASE_DELAY_MS,
      maxDelay: DEFAULT_RETRY_MAX_DELAY_MS,
      backoffFactor: DEFAULT_BACKOFF_FACTOR,
      retryOnRateLimit: true,
    },
    rateLimit: {
      autoHandle: true,
      safetyBuffer: DEFAULT_SAFETY_BUFFER, // 10% safety buffer
      maxConcurrent: DEFAULT_RATE_LIMIT_MAX_CONCURRENT,
    },
  };

  /**
   * Creates a new GravatarClient instance
   * @param options - Client configuration options
   */
  constructor(options: GravatarClientOptions = {}) {
    // Merge with defaults
    this.config = {
      ...GravatarClient.DEFAULTS,
      ...options,
      headers: {
        ...GravatarClient.DEFAULTS.headers,
        ...options.headers,
      },
      cache: {
        ...GravatarClient.DEFAULTS.cache,
        ...options.cache,
      },
      retry: {
        ...GravatarClient.DEFAULTS.retry,
        ...options.retry,
      },
      rateLimit: {
        ...GravatarClient.DEFAULTS.rateLimit,
        ...options.rateLimit,
      },
    };

    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalRetries: 0,
    };
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Fetches a Gravatar profile with advanced configuration
   * @param email - Email address to fetch profile for
   * @param options - Override options for this request
   * @returns Gravatar profile data
   */
  async getProfile(
    email: string,
    options: Partial<GravatarClientOptions> = {}
  ): Promise<GravatarProfile> {
    const mergedConfig = { ...this.config, ...options };
    const cacheKey = await this.getCacheKey(email, mergedConfig);

    // Check cache first
    if (mergedConfig.cache?.enabled) {
      const cached = this.getFromCache<GravatarProfile>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = await buildProfileUrl(email, mergedConfig);

    try {
      this.currentRequests++;
      const response = await this.makeRequestWithRetry<GravatarProfile>(
        url,
        mergedConfig,
        cacheKey
      );

      if (!response.data) {
        throw new GravatarError(
          'No profile data received',
          GRAVATAR_ERROR_CODES.INVALID_RESPONSE
        );
      }

      return response.data;
    } catch (error) {
      throw error;
    } finally {
      this.currentRequests--;
    }
  }

  /**
   * Fetches multiple Gravatar profiles in parallel with advanced batching
   * @param emails - Array of email addresses to fetch profiles for
   * @param options - Batch processing options
   * @returns Array of profile results (successful and failed)
   */
  async getProfiles(
    emails: string[],
    options: BatchOptions & { clientOptions?: Partial<GravatarClientOptions> } = {}
  ): Promise<Array<{
    email: string;
    profile?: GravatarProfile;
    error?: GravatarError;
  }>> {
    const {
      concurrency = DEFAULT_CONCURRENCY,
      failFast = false,
      batchDelay = 0,
      clientOptions = {}
    } = options;

    const results: Array<{
      email: string;
      profile?: GravatarProfile;
      error?: GravatarError;
    }> = [];

    // Process emails in batches
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);

      const batchPromises = batch.map(async (email) => {
        try {
          // Wait for a slot to free up if maxConcurrent is exceeded
          if (this.currentRequests >= (this.config.rateLimit?.maxConcurrent ?? DEFAULT_RATE_LIMIT_MAX_CONCURRENT)) {
            await new Promise<void>(resolve => {
              const interval = setInterval(() => {
                if (this.currentRequests < (this.config.rateLimit?.maxConcurrent ?? DEFAULT_RATE_LIMIT_MAX_CONCURRENT)) {
                  clearInterval(interval);
                  resolve();
                }
              }, RETRY_INTERVAL_MS);
            });
          }
          const profile = await this.getProfile(email, clientOptions);
          return { email, profile };
        } catch (error) {
          const gravatarError = error instanceof GravatarError
            ? error
            : new GravatarError(
              `Failed to fetch profile for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              GRAVATAR_ERROR_CODES.API_ERROR
            );

          if (failFast) {
            throw gravatarError;
          }

          return { email, error: gravatarError };
        }
      });

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            if (failFast && result.reason instanceof GravatarError) {
              throw result.reason;
            }
            // Extract email from the batch to maintain order
            const email = batch[index] || 'unknown';
            results.push({
              email,
              error: result.reason instanceof GravatarError
                ? result.reason
                : new GravatarError(
                  `Unexpected error for ${email}`,
                  GRAVATAR_ERROR_CODES.API_ERROR
                )
            });
          }
        });

        // Add delay between batches if specified
        if (batchDelay > 0 && i + concurrency < emails.length) {
          await this.delay(batchDelay);
        }
      } catch (error) {
        if (failFast) {
          throw error;
        }
        // Continue processing other batches
      }
    }

    return results;
  }

  /**
   * Clears the client-specific cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets comprehensive cache statistics
   * @returns Detailed cache statistics
   */
  getCacheStats(): ClientCacheStats {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expires: entry.expires,
      accessCount: entry.accessCount,
      lastAccess: entry.lastAccess,
    }));

    // Calculate cache hit statistics
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const cacheHits = totalAccesses - entries.length; // First access for each entry is a miss
    const cacheMisses = entries.length;
    const hitRatio = totalAccesses > 0 ? cacheHits / totalAccesses : 0;

    return {
      size: this.cache.size,
      ttl: (this.config.cache?.ttl ?? 3600000),
      maxSize: (this.config.cache?.maxSize ?? DEFAULT_CACHE_MAX_SIZE),
      hits: this.stats.cacheHits,
      misses: cacheMisses,
      hitRatio,
      entries,
    };
  }

  /**
   * Gets client request statistics
   * @returns Request statistics
   */
  getRequestStats(): ClientRequestStats {
    return { ...this.stats };
  }

  /**
   * Updates client configuration
   * @param options - New configuration options
   */
  updateConfig(options: Partial<GravatarClientOptions>): void {
    this.config = {
      ...this.config,
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
      retry: {
        ...this.config.retry,
        ...options.retry,
      },
      rateLimit: {
        ...this.config.rateLimit,
        ...options.rateLimit,
      },
    };
  }

  /**
   * Gets current client configuration
   * @returns Current configuration (without sensitive data)
   */
  getConfig(): Omit<GravatarClientOptions, 'apiKey'> {
    const { apiKey, ...configWithoutApiKey } = this.config;
    return configWithoutApiKey;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Makes an HTTP request with retry logic and advanced error handling
   * @param url - Request URL
   * @param config - Request configuration
   * @param cacheKey - Cache key for storing results
   * @returns Response data
   */
  private async makeRequestWithRetry<T>(
    url: string,
    config: Required<GravatarClientOptions>,
    cacheKey?: string
  ): Promise<GravatarApiResponse<T>> {
    let lastError: GravatarError | null = null;
    let attempt = 0;
    const maxAttempts = config.retry?.maxAttempts ?? DEFAULT_RETRY_MAX_ATTEMPTS;

    while (attempt < maxAttempts) {
      try {
        this.stats.totalRequests++;
        const response = await this.makeRequest<T>(url, config);

        // Cache successful response
        if (cacheKey && config.cache?.enabled) {
          this.setCache(cacheKey, response.data);
        }

        this.stats.successfulRequests++;
        return response;
      } catch (error) {
        lastError = error instanceof GravatarError ? error : new GravatarError(
          `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          GRAVATAR_ERROR_CODES.API_ERROR
        );

        attempt++;

        // Determine if we should retry
        const shouldRetry = this.shouldRetry(lastError, attempt, maxAttempts, config);

        if (!shouldRetry) {
          this.stats.failedRequests++;
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt, config);

        // Handle rate limits
        if (lastError.code === GRAVATAR_ERROR_CODES.RATE_LIMITED &&
          lastError.rateLimit &&
          config.rateLimit?.autoHandle) {
          const rateLimitDelay = this.calculateRateLimitDelay(lastError.rateLimit, config);
          await this.delay(Math.max(delay, rateLimitDelay));
        } else {
          await this.delay(delay);
        }

        this.stats.totalRetries++;
      }
    }

    // All attempts failed - count as failed request
    this.stats.failedRequests++;
    throw lastError || new GravatarError(
      'Request failed after all retry attempts',
      GRAVATAR_ERROR_CODES.API_ERROR
    );
  }

  /**
   * Makes a single HTTP request
   * @param url - Request URL
   * @param config - Request configuration
   * @returns Response data
   */
  private async makeRequest<T>(
    url: string,
    config: Required<GravatarClientOptions>
  ): Promise<GravatarApiResponse<T>> {
    const headers: Record<string, string> = {
      'User-Agent': `astro-gravatar-client/1.0.0`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add authorization if API key is provided
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update rate limit information
      const rateLimit = this.parseRateLimitHeaders(response.headers);
      if (rateLimit) {
        this.stats.currentRateLimit = rateLimit;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Use raw text if JSON parsing fails
        }

        throw new GravatarError(
          errorMessage,
          response.status === 429 ? GRAVATAR_ERROR_CODES.RATE_LIMITED :
            response.status === 401 ? GRAVATAR_ERROR_CODES.AUTH_ERROR :
              response.status === 404 ? GRAVATAR_ERROR_CODES.NOT_FOUND :
                GRAVATAR_ERROR_CODES.API_ERROR,
          response.status,
          rateLimit
        );
      }

      const data = await response.json();

      return {
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GravatarError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GravatarError(
          `Request timeout after ${config.timeout}ms`,
          GRAVATAR_ERROR_CODES.NETWORK_ERROR
        );
      }

      throw new GravatarError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GRAVATAR_ERROR_CODES.NETWORK_ERROR
      );
    }
  }

  /**
   * Determines if a request should be retried
   * @param error - The error that occurred
   * @param attempt - Current attempt number
   * @param maxAttempts - Maximum allowed attempts
   * @param config - Client configuration
   * @returns Whether to retry the request
   */
  private shouldRetry(
    error: GravatarError,
    attempt: number,
    maxAttempts: number,
    config: Required<GravatarClientOptions>
  ): boolean {
    // Don't retry if we've reached max attempts
    if (attempt >= maxAttempts) {
      return false;
    }

    // Don't retry authentication errors
    if (error.code === GRAVATAR_ERROR_CODES.AUTH_ERROR) {
      return false;
    }

    // Don't retry invalid email errors
    if (error.code === GRAVATAR_ERROR_CODES.INVALID_EMAIL) {
      return false;
    }

    // Don't retry not found errors (unless configured to)
    if (error.code === GRAVATAR_ERROR_CODES.NOT_FOUND) {
      return false;
    }

    // Retry on rate limit errors if configured
    if (error.code === GRAVATAR_ERROR_CODES.RATE_LIMITED) {
      return config.retry?.retryOnRateLimit ?? true;
    }

    // Retry on network errors and API errors
    if (error.code === GRAVATAR_ERROR_CODES.NETWORK_ERROR ||
      error.code === GRAVATAR_ERROR_CODES.API_ERROR) {
      return true;
    }

    // Default to retry for other errors
    return true;
  }

  /**
   * Calculates exponential backoff delay
   * @param attempt - Current attempt number
   * @param config - Client configuration
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(
    attempt: number,
    config: Required<GravatarClientOptions>
  ): number {
    const retryConfig = config.retry ?? GravatarClient.DEFAULTS.retry;
    const baseDelay = retryConfig.baseDelay ?? GravatarClient.DEFAULTS.retry.baseDelay ?? DEFAULT_RETRY_BASE_DELAY_MS;
    const backoffFactor = retryConfig.backoffFactor ?? GravatarClient.DEFAULTS.retry.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;
    const maxDelay = retryConfig.maxDelay ?? GravatarClient.DEFAULTS.retry.maxDelay ?? DEFAULT_RETRY_MAX_DELAY_MS;

    const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(
      exponentialDelay + jitter,
      maxDelay
    );
  }

  /**
   * Calculates delay based on rate limit information
   * @param rateLimit - Rate limit information
   * @param config - Client configuration
   * @returns Delay in milliseconds
   */
  private calculateRateLimitDelay(
    rateLimit: RateLimitInfo,
    config: Required<GravatarClientOptions>
  ): number {
    const now = Date.now(); // Current time in milliseconds
    const resetTime = rateLimit.reset * 1000; // Convert to milliseconds

    const safetyBuffer = (config.rateLimit?.safetyBuffer ?? DEFAULT_SAFETY_BUFFER);
    const bufferAmount = (resetTime - now) * safetyBuffer;

    const delayUntilReset = Math.max(0, resetTime - now + bufferAmount);

    return delayUntilReset;
  }

  /**
   * Parses rate limit headers from response
   * @param headers - Response headers
   * @returns Rate limit information
   */
  private parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return undefined;
  }

  /**
   * Generates cache key for requests
   * @param email - Email address
   * @param config - Request configuration
   * @returns Cache key
   */
  private async getCacheKey(email: string, config: Required<GravatarClientOptions>): Promise<string> {
    const emailHash = await hashEmailWithCache(email);
    const configHash = this.hashConfig(config);
    return `${emailHash}:${configHash}`;
  }

  /**
   * Creates a hash of configuration for cache key generation
   * @param config - Configuration to hash
   * @returns Configuration hash
   */
  private hashConfig(config: Required<GravatarClientOptions>): string {
    // Create a normalized config object for hashing
    const normalizedConfig = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey ? 'configured' : 'none', // Don't include actual key in hash
      timeout: config.timeout,
      headers: config.headers,
    };

    // Simple hash for now - in production you might want a more sophisticated approach
    return btoa(JSON.stringify(normalizedConfig)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Gets data from cache if valid
   * @param key - Cache key
   * @returns Cached data or undefined
   */
  private getFromCache<T>(key: string): T | undefined {
    const isCacheEnabled = this.config.cache?.enabled ?? true;
    if (!isCacheEnabled) {
      return undefined;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.cacheMisses++;
      return undefined;
    }

    const now = Date.now();
    if (now > entry.expires) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      return undefined;
    }

    // Update access statistics
    this.stats.cacheHits++;
    entry.accessCount++;
    entry.lastAccess = now;

    return entry.data as T;
  }

  /**
   * Sets data in cache with expiration
   * @param key - Cache key
   * @param data - Data to cache
   */
  private setCache<T>(key: string, data: T): void {
    const now = Date.now();
    const ttl = (this.config.cache?.ttl ?? DEFAULT_CACHE_TTL_SECONDS) * 1000; // Convert to milliseconds (ensure default)

    const entry: CacheEntry<T> = {
      data,
      expires: now + ttl,
      created: now,
      accessCount: 1,
      lastAccess: now,
    };

    this.cache.set(key, entry);

    // Remove old entries if cache is full
    // Prune if too large
    const maxSize = this.config.cache?.maxSize ?? DEFAULT_CACHE_MAX_SIZE;
    if (this.cache.size > maxSize) {
      this.evictOldestEntries();
    }
  }

  /**
   * Evicts oldest entries from cache to make room
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());

    // Sort by last access time
    entries.sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

    // Remove enough entries to maintain maxSize
    const maxSize = this.config.cache?.maxSize ?? DEFAULT_CACHE_MAX_SIZE;
    const toRemove = entries.length - maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Delays execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}