/**
 * Core Gravatar utilities including URL building and API client
 */

import {
  GravatarProfile,
  GravatarClientConfig,
  GravatarApiResponse,
  RateLimitInfo,
  GravatarError,
  GRAVATAR_ERROR_CODES,
  AvatarRating,
  DefaultAvatar
} from './types.js';
import { hashEmailWithCache } from '../utils/hash.js';

// ============================================================================
// Constants
// ============================================================================

/** Default Gravatar avatar base URL */
export const GRAVATAR_AVATAR_BASE = 'https://0.gravatar.com/avatar';

/** Default Gravatar API base URL */
export const GRAVATAR_API_BASE = 'https://api.gravatar.com/v3';

/** Default Gravatar QR code base URL */
export const GRAVATAR_QR_BASE = 'https://api.gravatar.com/v3/qr-code';

/** Default avatar sizes */
export const DEFAULT_AVATAR_SIZE = 80;

/** Default avatar rating */
export const DEFAULT_AVATAR_RATING: AvatarRating = 'g';

/** Default avatar image */
export const DEFAULT_AVATAR_IMAGE: DefaultAvatar = 'mp';

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT = 10000;

// ============================================================================
// URL Building Utilities
// ============================================================================

/**
 * Builds a Gravatar avatar URL
 * @param email - Email address
 * @param options - Avatar configuration options
 * @returns Complete avatar URL
 */
export async function buildAvatarUrl(
  email: string,
  options: {
    size?: number;
    rating?: AvatarRating;
    default?: DefaultAvatar;
    forceDefault?: boolean;
  } = {}
): Promise<string> {
  const hash = await hashEmailWithCache(email);
  const params = new URLSearchParams();

  // Add size parameter (1-2048 pixels)
  if (options.size && options.size !== DEFAULT_AVATAR_SIZE) {
    if (options.size < 1 || options.size > 2048) {
      throw new GravatarError(
        'Avatar size must be between 1 and 2048 pixels',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }
    params.set('s', options.size.toString());
  }

  // Add rating parameter
  if (options.rating && options.rating !== DEFAULT_AVATAR_RATING) {
    params.set('r', options.rating);
  }

  // Add default image parameter
  if (options.default && options.default !== DEFAULT_AVATAR_IMAGE) {
    if (typeof options.default === 'string' && !options.default.startsWith('http')) {
      // It's a predefined default type
      params.set('d', options.default);
    } else {
      // It's a URL, encode it
      params.set('d', encodeURIComponent(options.default));
    }
  }

  // Add force default parameter
  if (options.forceDefault) {
    params.set('f', 'y');
  }

  const queryString = params.toString();
  return `${GRAVATAR_AVATAR_BASE}/${hash}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Builds a Gravatar profile API URL
 * @param email - Email address
 * @param config - API client configuration
 * @returns Profile API URL
 */
export async function buildProfileUrl(email: string, config: GravatarClientConfig = {}): Promise<string> {
  const hash = await hashEmailWithCache(email);
  const baseUrl = config.baseUrl || GRAVATAR_API_BASE;
  return `${baseUrl}/profiles/${hash}`;
}

/**
 * Builds a Gravatar QR code URL
 * @param email - Email address
 * @param options - QR code configuration options
 * @returns QR code URL
 */
export async function buildQRCodeUrl(
  email: string,
  options: {
    size?: number;
    version?: 1 | 3;
    type?: 'user' | 'gravatar' | 'none';
    utmMedium?: string;
    utmCampaign?: string;
  } = {}
): Promise<string> {
  const hash = await hashEmailWithCache(email);
  const params = new URLSearchParams();

  // Add size parameter
  if (options.size && options.size !== 80) {
    if (options.size < 1 || options.size > 1000) {
      throw new GravatarError(
        'QR code size must be between 1 and 1000 pixels',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }
    params.set('size', options.size.toString());
  }

  // Add version parameter
  if (options.version && options.version !== 1) {
    params.set('version', options.version.toString());
  }

  // Add type parameter
  if (options.type && options.type !== 'none') {
    params.set('type', options.type);
  }

  // Add UTM parameters
  if (options.utmMedium) {
    params.set('utm_medium', options.utmMedium);
  }

  if (options.utmCampaign) {
    params.set('utm_campaign', options.utmCampaign);
  }

  const queryString = params.toString();
  return `${GRAVATAR_QR_BASE}/${hash}${queryString ? `?${queryString}` : ''}`;
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Simple in-memory cache for API responses
 */
const apiCache = new Map<string, { data: any; expires: number }>();

/**
 * Gets rate limit information from response headers
 * @param headers - Response headers
 * @returns Rate limit information
 */
function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
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
 * Makes an HTTP request with error handling and caching
 * @param url - Request URL
 * @param config - Request configuration
 * @param cacheKey - Optional cache key
 * @returns Response data
 */
async function makeRequest<T>(
  url: string,
  config: GravatarClientConfig = {},
  cacheKey?: string
): Promise<GravatarApiResponse<T>> {
  // Check cache first
  if (cacheKey && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey)!;
    if (cached.expires > Date.now()) {
      return { data: cached.data };
    } else {
      apiCache.delete(cacheKey);
    }
  }

  const headers: Record<string, string> = {
    'User-Agent': 'astro-gravatar/1.0.0',
    'Accept': 'application/json',
    ...config.headers,
  };

  // Add authorization if API key is provided
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rateLimit = parseRateLimitHeaders(response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
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

    // Cache successful responses
    if (cacheKey && rateLimit && rateLimit.remaining > 0) {
      const ttl = Math.min(300, rateLimit.reset - Date.now()) * 1000; // Max 5 minutes
      apiCache.set(cacheKey, { data, expires: Date.now() + ttl });
    }

    return { data, headers: Object.fromEntries(response.headers.entries()) };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof GravatarError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new GravatarError(
        'Request timeout',
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
 * Fetches a Gravatar profile
 * @param email - Email address
 * @param config - API client configuration
 * @returns Gravatar profile data
 */
export async function getProfile(
  email: string,
  config: GravatarClientConfig = {}
): Promise<GravatarProfile> {
  const url = await buildProfileUrl(email, config);
  const emailHash = await hashEmailWithCache(email);
  const cacheKey = `profile:${emailHash}:${config.apiKey ? 'auth' : 'public'}`;

  const response = await makeRequest<GravatarProfile>(url, config, cacheKey);

  if (!response.data) {
    throw new GravatarError(
      'No profile data received',
      GRAVATAR_ERROR_CODES.INVALID_RESPONSE
    );
  }

  return response.data;
}

/**
 * Fetches multiple profiles in parallel
 * @param emails - Array of email addresses
 * @param config - API client configuration
 * @returns Array of profile data
 */
export async function getProfiles(
  emails: string[],
  config: GravatarClientConfig = {}
): Promise<GravatarProfile[]> {
  const promises = emails.map(email => getProfile(email, config));
  return Promise.allSettled(promises).then(results => {
    const profiles: GravatarProfile[] = [];
    const errors: GravatarError[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        profiles.push(result.value);
      } else {
        errors.push(result.reason);
        // For failed profiles, we could add a placeholder or skip
        // For now, we'll just skip them
      }
    });

    if (errors.length > 0 && profiles.length === 0) {
      throw errors[0]; // Throw first error if all failed
    }

    return profiles;
  });
}

/**
 * Clears the API cache
 */
export function clearApiCache(): void {
  apiCache.clear();
}

/**
 * Gets API cache statistics
 */
export function getApiCacheStats(): {
  size: number;
  entries: Array<{ key: string; expires: number }>;
} {
  const entries = Array.from(apiCache.entries()).map(([key, value]) => ({
    key,
    expires: value.expires,
  }));

  return {
    size: apiCache.size,
    entries,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates avatar parameters
 * @param size - Avatar size
 * @param rating - Avatar rating
 * @throws GravatarError if parameters are invalid
 */
export function validateAvatarParams(size?: number, rating?: AvatarRating): void {
  if (size !== undefined) {
    if (typeof size !== 'number' || size < 1 || size > 2048) {
      throw new GravatarError(
        'Avatar size must be a number between 1 and 2048',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }
  }

  if (rating !== undefined) {
    const validRatings: AvatarRating[] = ['g', 'pg', 'r', 'x'];
    if (!validRatings.includes(rating)) {
      throw new GravatarError(
        `Avatar rating must be one of: ${validRatings.join(', ')}`,
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }
  }
}

/**
 * Gets default avatar configuration
 * @returns Default avatar configuration
 */
export function getDefaultAvatarConfig(): {
  size: number;
  rating: AvatarRating;
  default: DefaultAvatar;
  forceDefault: boolean;
} {
  return {
    size: DEFAULT_AVATAR_SIZE,
    rating: DEFAULT_AVATAR_RATING,
    default: DEFAULT_AVATAR_IMAGE,
    forceDefault: false,
  };
}