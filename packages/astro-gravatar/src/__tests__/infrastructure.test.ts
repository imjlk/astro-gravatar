/**
 * Test to verify the test infrastructure is properly set up
 */

import { test, expect, describe } from 'bun:test';
import { setupTestEnvironment, generateRandomEmail, generateEmailHash } from '../../test-utils/test-helpers';
import { mockGravatarProfile, mockSuccessfulProfileResponse } from './mocks';
import { VALID_EMAILS, INVALID_EMAILS } from './fixtures';

// Set up test environment
setupTestEnvironment();

describe('Test Infrastructure', () => {
  test('should have valid test environment setup', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should generate random emails correctly', () => {
    const email = generateRandomEmail();
    expect(email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  });

  test('should generate consistent email hashes', () => {
    const email = 'test@example.com';
    const hash1 = generateEmailHash(email);
    const hash2 = generateEmailHash(email);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(32);
    expect(hash1).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should have valid mock data', () => {
    expect(mockGravatarProfile).toBeDefined();
    expect(mockGravatarProfile.hash).toHaveLength(32);
    expect(mockGravatarProfile.display_name).toBeTruthy();
    expect(mockGravatarProfile.avatar_url).toContain('gravatar.com/avatar');
  });

  test('should have valid API response mocks', () => {
    expect(mockSuccessfulProfileResponse.data).toBeDefined();
    expect(mockSuccessfulProfileResponse.status).toBe(200);
    expect(mockSuccessfulProfileResponse.error).toBeUndefined();
  });

  test('should have valid email fixtures', () => {
    expect(VALID_EMAILS).toHaveLength(6);
    expect(INVALID_EMAILS).toHaveLength(6);

    // All valid emails should pass regex test
    VALID_EMAILS.forEach(email => {
      expect(email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    });

    // All invalid emails should fail regex test
    INVALID_EMAILS.forEach(email => {
      expect(email).not.toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    });
  });
});

describe('Mock Infrastructure', () => {
  test('should provide realistic mock responses', () => {
    const profile = mockGravatarProfile;

    // Required fields
    expect(profile.hash).toBeTruthy();
    expect(profile.profile_url).toBeTruthy();
    expect(profile.avatar_url).toBeTruthy();
    expect(profile.avatar_alt_text).toBeTruthy();
    expect(profile.display_name).toBeTruthy();

    // URL patterns
    expect(profile.profile_url).toMatch(/^https:\/\/gravatar\.com\//);
    expect(profile.avatar_url).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\//);
  });

  test('should handle different user types', () => {
    expect(mockGravatarProfile.is_organization).toBe(false);
    expect(mockGravatarProfile.pronouns).toBeTruthy();
    expect(mockGravatarProfile.job_title).toBeTruthy();
  });
});

describe('Test Utilities', () => {
  test('should create consistent test data', () => {
    const email1 = generateRandomEmail();
    const email2 = generateRandomEmail();

    expect(email1).not.toBe(email2);
    expect(email1).toContain('@example.com');
    expect(email2).toContain('@example.com');
  });

  test('should handle edge cases in email generation', () => {
    const customDomainEmail = generateRandomEmail('custom.domain.org');
    expect(customDomainEmail).toContain('@custom.domain.org');
  });
});