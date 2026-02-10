/**
 * Email hashing utilities for Gravatar
 * Uses SHA256 as recommended by the Gravatar API
 */

import { GravatarError, GRAVATAR_ERROR_CODES } from '../lib/types.js';
import { CACHE_TTL_MS, DEFAULT_CACHE_MAX_SIZE } from '../constants.js';
import { isValidEmail } from './validation.js';

export { isValidEmail };

/**
 * Normalizes an email address for Gravatar processing
 * @param email - Email address to normalize
 * @returns Normalized email (trimmed and lowercase)
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new GravatarError(
      'Email must be a string',
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  const trimmed = email.trim();

  if (!trimmed) {
    throw new GravatarError(
      'Email cannot be empty',
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  if (!isValidEmail(trimmed)) {
    throw new GravatarError(
      `Invalid email format: ${trimmed}`,
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  return trimmed.toLowerCase();
}

/**
 * Creates a SHA256 hash of an email address for Gravatar API usage
 * @param email - Email address to hash
 * @returns SHA256 hash of the normalized email
 * @throws GravatarError if email is invalid
 */
export async function hashEmail(email: string): Promise<string> {
  try {
    const normalizedEmail = normalizeEmail(email);
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    if (error instanceof GravatarError) {
      throw error;
    }

    throw new GravatarError(
      `Failed to hash email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      GRAVATAR_ERROR_CODES.HASH_ERROR
    );
  }
}

/**
 * Batch hash multiple email addresses
 * @param emails - Array of email addresses to hash
 * @returns Array of SHA256 hashes
 * @throws GravatarError if any email is invalid
 */
export async function hashEmails(emails: string[]): Promise<string[]> {
  if (!Array.isArray(emails)) {
    throw new GravatarError(
      'Emails must be provided as an array',
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  return Promise.all(emails.map(email => hashEmail(email)));
}

/**
 * Validates a Gravatar hash format
 * @param hash - Hash string to validate
 * @returns True if hash is a valid SHA256 hash
 */
export function isValidGravatarHash(hash: string): boolean {
  return typeof hash === 'string' &&
         /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Extracts hash from various input formats
 * @param input - Email address, hash, or profile URL
 * @returns SHA256 hash of the email
 */
export async function extractHash(input: string): Promise<string> {
  if (!input || typeof input !== 'string') {
    throw new GravatarError(
      'Input must be a non-empty string',
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  // If it's already a valid hash, return it
  if (isValidGravatarHash(input)) {
    return input.toLowerCase();
  }

  // If it looks like a Gravatar profile URL, extract the hash
  if (input.includes('gravatar.com/')) {
    const match = input.match(/gravatar\.com\/([a-f0-9]{64})/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  // Otherwise, treat it as an email and hash it
  return hashEmail(input);
}

/**
 * Cache for recently hashed emails to improve performance
 */
const emailHashCache = new Map<string, { hash: string; timestamp: number }>();
const inFlightHashes = new Map<string, Promise<string>>();
const CACHE_TTL = CACHE_TTL_MS; // 5 minutes
const CACHE_MAX_SIZE = DEFAULT_CACHE_MAX_SIZE;

/**
 * Creates a SHA256 hash with optional caching
 * @param email - Email address to hash
 * @param useCache - Whether to use caching (default: true)
 * @returns SHA256 hash of the normalized email
 */
export async function hashEmailWithCache(email: string, useCache: boolean = true): Promise<string> {
  if (!useCache) {
    return hashEmail(email);
  }

  const normalizedEmail = normalizeEmail(email);
  const cached = emailHashCache.get(normalizedEmail);
  const now = Date.now();

  // Check cache first
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.hash;
  }

  const inFlight = inFlightHashes.get(normalizedEmail);
  if (inFlight) {
    return await inFlight;
  }

  const hashPromise = hashEmail(email);
  inFlightHashes.set(normalizedEmail, hashPromise);

  try {
    const hash = await hashPromise;

    // Update cache (cleanup if too large)
    if (emailHashCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entries
      const oldestKeys = Array.from(emailHashCache.keys())
        .sort((a, b) => emailHashCache.get(a)!.timestamp - emailHashCache.get(b)!.timestamp)
        .slice(0, Math.floor(CACHE_MAX_SIZE / 2));

      oldestKeys.forEach(key => emailHashCache.delete(key));
    }

    emailHashCache.set(normalizedEmail, { hash, timestamp: now });

    return hash;
  } finally {
    inFlightHashes.delete(normalizedEmail);
  }
}

/**
 * Clears the email hash cache
 */
export function clearEmailHashCache(): void {
  emailHashCache.clear();
}

/**
 * Gets cache statistics
 */
export function getEmailHashCacheStats(): {
  size: number;
  maxSize: number;
  ttl: number;
} {
  return {
    size: emailHashCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttl: CACHE_TTL,
  };
}