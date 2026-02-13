import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  createMockFetch,
  setupFetchMock,
  mockRateLimit,
  mockRateLimitExceeded,
  mockGravatarProfile,
  mockMinimalGravatarProfile,
  mockOrganizationProfile,
  mockSuccessfulProfileResponse,
  mockNotFoundResponse,
  mockRateLimitResponse,
  mockServerErrorResponse,
  mockNetworkErrorResponse,
  mockAvatarImageResponse,
  mockAvatar404Response,
  mockGravatarError,
  mockRateLimitError,
  mockNetworkError,
} from './mocks';

describe('createMockFetch', () => {
  test('should return matching response for URL pattern', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const mockFetch = createMockFetch({
      'gravatar.com/test': mockResponse,
    });

    const response = await mockFetch('https://gravatar.com/test/profile');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ data: 'test' });
  });

  test('should return matching response for URL object input', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const mockFetch = createMockFetch({
      'api.example.com': mockResponse,
    });

    const url = new URL('https://api.example.com/users');
    const response = await mockFetch(url);
    expect(response.status).toBe(200);
  });

  test('should handle Request object input (returns 404 due to toString limitation)', async () => {
    const mockResponse = new Response(JSON.stringify({ request: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const mockFetch = createMockFetch({
      'api.gravatar.com': mockResponse,
    });

    const request = new Request('https://api.gravatar.com/profile');
    const response = await mockFetch(request);
    expect(response.status).toBe(404);
    expect((global as any).mockFetch).toBeUndefined();
  });

  test('should return 404 for unmatched URL pattern', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
    });

    const mockFetch = createMockFetch({
      'gravatar.com/known': mockResponse,
    });

    const response = await mockFetch('https://gravatar.com/unknown-hash');
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: 'Not found' });
  });

  test('should return cloned response to allow multiple uses', async () => {
    const mockResponse = new Response(JSON.stringify({ count: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const mockFetch = createMockFetch({
      'api.test.com': mockResponse,
    });

    const response1 = await mockFetch('https://api.test.com/data');
    const data1 = await response1.json();
    expect(data1).toEqual({ count: 1 });

    const response2 = await mockFetch('https://api.test.com/data');
    const data2 = await response2.json();
    expect(data2).toEqual({ count: 1 });
  });

  test('should match partial URL patterns', async () => {
    const profileResponse = new Response(JSON.stringify({ profile: true }), {
      status: 200,
    });

    const mockFetch = createMockFetch({
      hash123: profileResponse,
    });

    const response = await mockFetch('https://gravatar.com/hash123/profile');
    expect(response.status).toBe(200);
  });

  test('should handle multiple patterns with correct precedence', async () => {
    const specificResponse = new Response(JSON.stringify({ specific: true }), {
      status: 200,
    });
    const genericResponse = new Response(JSON.stringify({ generic: true }), {
      status: 200,
    });

    const mockFetch = createMockFetch({
      user123: specificResponse,
      'gravatar.com': genericResponse,
    });

    const response = await mockFetch('https://gravatar.com/user123');
    const data = await response.json();
    expect(data).toEqual({ specific: true });
  });
});

describe('setupFetchMock', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    cleanup = undefined;
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  });

  test('should set up global fetch mock', () => {
    const originalFetch = global.fetch;
    cleanup = setupFetchMock();

    expect(global.fetch).not.toBe(originalFetch);
    expect((global as any).mockFetch).toBeDefined();
  });

  test('should return cleanup function that restores original fetch', () => {
    const originalFetch = global.fetch;
    cleanup = setupFetchMock();

    expect(global.fetch).not.toBe(originalFetch);

    cleanup();
    cleanup = undefined;

    expect(global.fetch).toBe(originalFetch);
    expect((global as any).mockFetch).toBeUndefined();
  });

  test('should handle successful profile response', async () => {
    cleanup = setupFetchMock();

    const response = await fetch('https://gravatar.com/205e460b479e2e5b48aec07710c08d50');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.hash).toBe('205e460b479e2e5b48aec07710c08d50');
  });

  test('should handle 404 not found response', async () => {
    cleanup = setupFetchMock();

    const response = await fetch('https://gravatar.com/00000000000000000000000000000000');
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should handle rate limited response', async () => {
    cleanup = setupFetchMock();

    const response = await fetch('https://gravatar.com/ratelimited');
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error).toContain('Rate limit');
  });

  test('should return 404 for unmatched URLs', async () => {
    cleanup = setupFetchMock();

    const response = await fetch('https://gravatar.com/unknown-profile-hash');
    expect(response.status).toBe(404);
  });

  test('should allow multiple setup/cleanup cycles', () => {
    const originalFetch = global.fetch;

    cleanup = setupFetchMock();
    expect(global.fetch).not.toBe(originalFetch);
    cleanup();
    expect(global.fetch).toBe(originalFetch);

    cleanup = setupFetchMock();
    expect(global.fetch).not.toBe(originalFetch);
    cleanup();
    cleanup = undefined;
    expect(global.fetch).toBe(originalFetch);
  });
});

describe('Mock Rate Limit Data', () => {
  test('should have valid rate limit info', () => {
    expect(mockRateLimit.limit).toBe(1000);
    expect(mockRateLimit.remaining).toBe(999);
    expect(mockRateLimit.reset).toBeGreaterThan(Date.now() / 1000);
  });

  test('should have valid exceeded rate limit info', () => {
    expect(mockRateLimitExceeded.limit).toBe(1000);
    expect(mockRateLimitExceeded.remaining).toBe(0);
    expect(mockRateLimitExceeded.reset).toBeGreaterThan(Date.now() / 1000);
  });
});

describe('Mock Profile Data', () => {
  test('should have valid full profile mock', () => {
    expect(mockGravatarProfile.hash).toBe('205e460b479e2e5b48aec07710c08d50');
    expect(mockGravatarProfile.display_name).toBe('John Doe');
    expect(mockGravatarProfile.is_organization).toBe(false);
    expect(mockGravatarProfile.verified_accounts).toHaveLength(2);
    expect(mockGravatarProfile.links).toHaveLength(2);
    expect(mockGravatarProfile.interests).toHaveLength(2);
  });

  test('should have valid minimal profile mock', () => {
    expect(mockMinimalGravatarProfile.hash).toBe('205e460b479e2e5b48aec07710c08d50');
    expect(mockMinimalGravatarProfile.display_name).toBe('Minimal User');
    expect(mockMinimalGravatarProfile.avatar_url).toContain('gravatar.com/avatar');
  });

  test('should have valid organization profile mock', () => {
    expect(mockOrganizationProfile.is_organization).toBe(true);
    expect(mockOrganizationProfile.display_name).toBe('Tech Corp');
    expect(mockOrganizationProfile.company).toBe('Tech Corp');
    expect(mockOrganizationProfile.job_title).toBeUndefined();
    expect(mockOrganizationProfile.pronouns).toBeUndefined();
  });
});

describe('Mock API Responses', () => {
  test('should have valid successful profile response', () => {
    expect(mockSuccessfulProfileResponse.data).toBeDefined();
    expect(mockSuccessfulProfileResponse.status).toBe(200);
    expect(mockSuccessfulProfileResponse.error).toBeUndefined();
    expect(mockSuccessfulProfileResponse.headers).toBeDefined();
    expect(mockSuccessfulProfileResponse.headers!['x-ratelimit-limit']).toBe('1000');
  });

  test('should have valid not found response', () => {
    expect(mockNotFoundResponse.error).toBe('Profile not found');
    expect(mockNotFoundResponse.status).toBe(404);
    expect(mockNotFoundResponse.data).toBeUndefined();
  });

  test('should have valid rate limit response', () => {
    expect(mockRateLimitResponse.error).toBe('Rate limit exceeded');
    expect(mockRateLimitResponse.status).toBe(429);
    expect(mockRateLimitResponse.headers!['x-ratelimit-remaining']).toBe('0');
  });

  test('should have valid server error response', () => {
    expect(mockServerErrorResponse.error).toBe('Internal server error');
    expect(mockServerErrorResponse.status).toBe(500);
  });

  test('should have valid network error response', () => {
    expect(mockNetworkErrorResponse.error).toBe('Network error');
    expect(mockNetworkErrorResponse.status).toBe(0);
  });
});

describe('Mock Avatar Responses', () => {
  test('should have valid avatar image response', async () => {
    expect(mockAvatarImageResponse.status).toBe(200);
    expect(mockAvatarImageResponse.headers.get('Content-Type')).toBe('image/png');
    expect(mockAvatarImageResponse.headers.get('Content-Length')).toBe('100');
    expect(mockAvatarImageResponse.headers.get('Cache-Control')).toContain('max-age');

    const body = await mockAvatarImageResponse.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
  });

  test('should have valid avatar 404 response', () => {
    expect(mockAvatar404Response.status).toBe(404);
    expect(mockAvatar404Response.headers.get('Content-Type')).toBe('image/png');
  });
});

describe('Mock Errors', () => {
  test('should have valid Gravatar error', () => {
    expect(mockGravatarError.message).toBe('Profile not found');
    expect(mockGravatarError.code).toBe('NOT_FOUND');
    expect(mockGravatarError.status).toBe(404);
  });

  test('should have valid rate limit error', () => {
    expect(mockRateLimitError.message).toBe('Rate limit exceeded');
    expect(mockRateLimitError.code).toBe('RATE_LIMITED');
    expect(mockRateLimitError.status).toBe(429);
    expect(mockRateLimitError.rateLimit).toBeDefined();
    expect(mockRateLimitError.rateLimit!.remaining).toBe(0);
  });

  test('should have valid network error', () => {
    expect(mockNetworkError.message).toBe('Network error');
    expect(mockNetworkError.code).toBe('NETWORK_ERROR');
    expect(mockNetworkError.status).toBe(0);
  });
});
