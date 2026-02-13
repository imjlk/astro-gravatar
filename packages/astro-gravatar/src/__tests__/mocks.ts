/**
 * Mocks for Gravatar API responses and services
 * Provides realistic mock data for testing various scenarios
 */

import type { GravatarProfile, GravatarApiResponse, RateLimitInfo } from '../lib/types';
import { GravatarError as GravatarErrorClass } from '../lib/types';

// ============================================================================
// Rate Limit Mocks
// ============================================================================

export const mockRateLimit: RateLimitInfo = {
  limit: 1000,
  remaining: 999,
  reset: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

export const mockRateLimitExceeded: RateLimitInfo = {
  limit: 1000,
  remaining: 0,
  reset: Math.floor(Date.now() / 1000) + 3600,
};

// ============================================================================
// Gravatar Profile Mocks
// ============================================================================

export const mockGravatarProfile: GravatarProfile = {
  hash: '205e460b479e2e5b48aec07710c08d50',
  profile_url: 'https://gravatar.com/johndoe',
  avatar_url: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  avatar_alt_text: 'Avatar for John Doe',
  display_name: 'John Doe',
  pronouns: 'he/him',
  location: 'San Francisco, CA',
  job_title: 'Senior Software Engineer',
  company: 'Tech Corp',
  description: 'Passionate developer with expertise in web technologies',
  verified_accounts: [
    {
      service_type: 'twitter',
      service_label: 'Twitter',
      service_icon: 'https://www.gravatar.com/cache/images/icons/twitter.png',
      url: 'https://twitter.com/johndoe',
      is_hidden: false,
    },
    {
      service_type: 'github',
      service_label: 'GitHub',
      service_icon: 'https://www.gravatar.com/cache/images/icons/github.png',
      url: 'https://github.com/johndoe',
      is_hidden: false,
    },
  ],
  pronunciation: 'John Doe',
  timezone: 'America/Los_Angeles',
  languages: ['English', 'Spanish'],
  first_name: 'John',
  last_name: 'Doe',
  is_organization: false,
  header_image: 'https://images.gravatar.com/userimages/205e460b479e2e5b48aec07710c08d50?size=600',
  hide_default_header_image: false,
  background_color: '#f0f0f0',
  links: [
    {
      label: 'Personal Website',
      url: 'https://johndoe.dev',
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/johndoe',
    },
  ],
  interests: [
    {
      id: 1,
      name: 'Web Development',
      slug: '1-web-development',
    },
    {
      id: 2,
      name: 'Open Source',
      slug: '2-open-source',
    },
  ],
  payments: [
    {
      label: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
  ],
  contact_info: {
    email: 'john.doe@example.com',
    emails: ['john.doe@example.com', 'john@techcorp.com'],
    phone_numbers: ['+1-555-0123'],
    websites: ['https://johndoe.dev'],
  },
  gallery: [
    {
      image_id: 'img_123',
      image_url: 'https://images.gravatar.com/userimages/205e460b479e2e5b48aec07710c08d50/original',
      rating: 'g',
      alt_text: 'Professional headshot',
      selected: true,
      updated_date: '2024-01-15T10:30:00Z',
    },
  ],
  number_verified_accounts: 2,
  last_profile_edit: '2024-01-15T10:30:00Z',
  registration_date: '2020-05-20T14:22:00Z',
};

export const mockMinimalGravatarProfile: GravatarProfile = {
  hash: '205e460b479e2e5b48aec07710c08d50',
  profile_url: 'https://gravatar.com/minimal',
  avatar_url: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  avatar_alt_text: 'Avatar for Minimal User',
  display_name: 'Minimal User',
};

export const mockOrganizationProfile: GravatarProfile = {
  ...mockGravatarProfile,
  display_name: 'Tech Corp',
  is_organization: true,
  company: 'Tech Corp',
  job_title: undefined,
  pronouns: undefined,
};

// ============================================================================
// API Response Mocks
// ============================================================================

export const mockSuccessfulProfileResponse: GravatarApiResponse<GravatarProfile> = {
  data: mockGravatarProfile,
  status: 200,
  headers: {
    'x-ratelimit-limit': '1000',
    'x-ratelimit-remaining': '999',
    'x-ratelimit-reset': mockRateLimit.reset.toString(),
  },
};

export const mockNotFoundResponse: GravatarApiResponse = {
  error: 'Profile not found',
  status: 404,
  headers: {
    'x-ratelimit-limit': '1000',
    'x-ratelimit-remaining': '998',
    'x-ratelimit-reset': mockRateLimit.reset.toString(),
  },
};

export const mockRateLimitResponse: GravatarApiResponse = {
  error: 'Rate limit exceeded',
  status: 429,
  headers: {
    'x-ratelimit-limit': '1000',
    'x-ratelimit-remaining': '0',
    'x-ratelimit-reset': mockRateLimit.reset.toString(),
  },
};

export const mockServerErrorResponse: GravatarApiResponse = {
  error: 'Internal server error',
  status: 500,
};

export const mockNetworkErrorResponse: GravatarApiResponse = {
  error: 'Network error',
  status: 0,
};

// ============================================================================
// Mock Implementation
// ============================================================================

/**
 * Creates a mock fetch function that simulates Gravatar API responses
 */
export function createMockFetch(responseMap: Record<string, Response>): any {
  return (async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Find matching mock response
    for (const [pattern, response] of Object.entries(responseMap)) {
      if (url.includes(pattern)) {
        return response.clone();
      }
    }

    // Default to 404 if no pattern matches
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as any;
}

/**
 * Sets up global fetch mock for testing
 */
export function setupFetchMock() {
  const mockResponses: Record<string, Response> = {
    // Default successful profile response
    'gravatar.com/205e460b479e2e5b48aec07710c08d50': new Response(
      JSON.stringify(mockSuccessfulProfileResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...mockSuccessfulProfileResponse.headers,
        },
      }
    ),

    // 404 not found
    'gravatar.com/00000000000000000000000000000000': new Response(
      JSON.stringify(mockNotFoundResponse),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...mockNotFoundResponse.headers,
        },
      }
    ),

    // Rate limited
    'gravatar.com/ratelimited': new Response(JSON.stringify(mockRateLimitResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...mockRateLimitResponse.headers,
      },
    }),
  };

  const mockFetch = createMockFetch(mockResponses);
  (global as any).mockFetch = mockFetch;

  // Store original fetch
  const originalFetch = global.fetch;

  // Replace fetch with mock
  (global as any).fetch = mockFetch;

  // Return cleanup function
  return () => {
    (global as any).fetch = originalFetch;
    (global as any).mockFetch = undefined;
  };
}

/**
 * Mocks for avatar image responses
 */
export const mockAvatarImageResponse = new Response(
  new Uint8Array(Buffer.from('fake-image-data')),
  {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': '100',
      'Cache-Control': 'public, max-age=31536000',
    },
  }
);

export const mockAvatar404Response = new Response(null, {
  status: 404,
  headers: {
    'Content-Type': 'image/png',
  },
});

// ============================================================================
// Error Mocks
// ============================================================================

export const mockGravatarError = new GravatarErrorClass('Profile not found', 'NOT_FOUND', 404);

export const mockRateLimitError = new GravatarErrorClass(
  'Rate limit exceeded',
  'RATE_LIMITED',
  429,
  mockRateLimitExceeded
);

export const mockNetworkError = new GravatarErrorClass('Network error', 'NETWORK_ERROR', 0);
