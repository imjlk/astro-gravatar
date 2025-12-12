/**
 * Email hashing utilities for Gravatar
 * Uses SHA256 as recommended by the Gravatar API
 */

import { createHash } from 'node:crypto';
import { GravatarError, GRAVATAR_ERROR_CODES } from '../lib/types.js';

/**
 * Email validation regex
 * Checks for basic email format without being overly restrictive
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

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
export function hashEmail(email: string): string {
  try {
    const normalizedEmail = normalizeEmail(email);
    return createHash('sha256').update(normalizedEmail).digest('hex');
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
export function hashEmails(emails: string[]): string[] {
  if (!Array.isArray(emails)) {
    throw new GravatarError(
      'Emails must be provided as an array',
      GRAVATAR_ERROR_CODES.INVALID_EMAIL
    );
  }

  return emails.map(email => hashEmail(email));
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
export function extractHash(input: string): string {
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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 1000;

/**
 * Creates a SHA256 hash with optional caching
 * @param email - Email address to hash
 * @param useCache - Whether to use caching (default: true)
 * @returns SHA256 hash of the normalized email
 */
export function hashEmailWithCache(email: string, useCache: boolean = true): string {
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

  // Generate new hash
  const hash = hashEmail(email);

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