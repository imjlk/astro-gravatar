/**
 * Comprehensive mock responses for Gravatar API testing
 * Provides realistic API responses for various scenarios and edge cases
 */

import type {
  GravatarProfile,
  GravatarApiResponse,
  RateLimitInfo,
  Avatar,
  VerifiedAccount,
  Link,
  Interest,
  CryptoWalletAddress,
  ContactInfo,
} from '../src/lib/types';

// ============================================================================
// HTTP Response Headers
// ============================================================================

export const mockResponseHeaders = {
  success: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
    'X-Ratelimit-Limit': '1000',
    'X-Ratelimit-Remaining': '999',
    'X-Ratelimit-Reset': Math.floor(Date.now() / 1000 + 3600).toString(),
  },
  notFound: {
    'Content-Type': 'application/json',
    'X-Ratelimit-Limit': '1000',
    'X-Ratelimit-Remaining': '998',
    'X-Ratelimit-Reset': Math.floor(Date.now() / 1000 + 3600).toString(),
  },
  rateLimited: {
    'Content-Type': 'application/json',
    'X-Ratelimit-Limit': '1000',
    'X-Ratelimit-Remaining': '0',
    'X-Ratelimit-Reset': Math.floor(Date.now() / 1000 + 300).toString(),
    'Retry-After': '300',
  },
  serverError: {
    'Content-Type': 'application/json',
  },
  image: {
    'Content-Type': 'image/png',
    'Content-Length': '1234',
    'Cache-Control': 'public, max-age=31536000',
    'ETag': '"mock-etag-12345"',
  },
  imageNotFound: {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=300',
  },
};

// ============================================================================
// Complete Profile Mocks
// ============================================================================

export const mockFullProfile: GravatarProfile = {
  hash: '205e460b479e2e5b48aec07710c08d50',
  profile_url: 'https://gravatar.com/johnsmith',
  avatar_url: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
  avatar_alt_text: 'Avatar for John Smith',
  display_name: 'John Smith',
  pronouns: 'he/him',
  location: 'San Francisco, CA',
  job_title: 'Senior Software Engineer',
  company: 'Tech Innovations Inc.',
  description: 'Passionate about building scalable web applications and open source contributions',
  verified_accounts: [
    {
      service_type: 'twitter',
      service_label: 'Twitter',
      service_icon: 'https://www.gravatar.com/cache/images/icons/twitter.png',
      url: 'https://twitter.com/johnsmith',
      is_hidden: false,
    },
    {
      service_type: 'github',
      service_label: 'GitHub',
      service_icon: 'https://www.gravatar.com/cache/images/icons/github.png',
      url: 'https://github.com/johnsmith',
      is_hidden: false,
    },
    {
      service_type: 'linkedin',
      service_label: 'LinkedIn',
      service_icon: 'https://www.gravatar.com/cache/images/icons/linkedin.png',
      url: 'https://linkedin.com/in/johnsmith',
      is_hidden: false,
    },
  ],
  pronunciation: 'John Smith',
  timezone: 'America/Los_Angeles',
  languages: ['English', 'Spanish', 'French'],
  first_name: 'John',
  last_name: 'Smith',
  is_organization: false,
  header_image: 'https://images.gravatar.com/userimages/205e460b479e2e5b48aec07710c08d50?size=600',
  hide_default_header_image: false,
  background_color: '#1a1a1a',
  links: [
    {
      label: 'Personal Blog',
      url: 'https://johnsmith.dev',
    },
    {
      label: 'Portfolio',
      url: 'https://portfolio.johnsmith.dev',
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/johnsmith',
    },
  ],
  interests: [
    { id: 1, name: 'Web Development', slug: '1-web-development' },
    { id: 2, name: 'Machine Learning', slug: '2-machine-learning' },
    { id: 3, name: 'Photography', slug: '3-photography' },
    { id: 4, name: 'Open Source', slug: '4-open-source' },
  ],
  payments: [
    {
      label: 'Bitcoin',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
    {
      label: 'Ethereum',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    },
  ],
  contact_info: {
    email: 'john.smith@example.com',
    emails: ['john.smith@example.com', 'john@techinnovations.com'],
    phone_numbers: ['+1-555-0123', '+1-555-0456'],
    websites: ['https://johnsmith.dev', 'https://blog.johnsmith.dev'],
  },
  gallery: [
    {
      image_id: 'img_001',
      image_url: 'https://images.gravatar.com/userimages/205e460b479e2e5b48aec07710c08d50/original',
      rating: 'g',
      alt_text: 'Professional headshot',
      selected: true,
      updated_date: '2024-01-15T10:30:00Z',
    },
    {
      image_id: 'img_002',
      image_url: 'https://images.gravatar.com/userimages/205e460b479e2e5b48aec07710c08d50/img002',
      rating: 'g',
      alt_text: 'Casual photo',
      selected: false,
      updated_date: '2024-01-10T15:45:00Z',
    },
  ],
  number_verified_accounts: 3,
  last_profile_edit: '2024-01-15T10:30:00Z',
  registration_date: '2020-05-20T14:22:00Z',
};

export const mockMinimalProfile: GravatarProfile = {
  hash: '7d4a7976b4b8a5d2e5f6a7b8c9d0e1f2',
  profile_url: 'https://gravatar.com/minimaluser',
  avatar_url: 'https://www.gravatar.com/avatar/7d4a7976b4b8a5d2e5f6a7b8c9d0e1f2',
  avatar_alt_text: 'Avatar for Minimal User',
  display_name: 'Minimal User',
};

export const mockOrganizationProfile: GravatarProfile = {
  hash: '3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
  profile_url: 'https://gravatar.com/acmecorp',
  avatar_url: 'https://www.gravatar.com/avatar/3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
  avatar_alt_text: 'Avatar for Acme Corp',
  display_name: 'Acme Corporation',
  location: 'New York, NY',
  description: 'Leading provider of innovative solutions',
  verified_accounts: [
    {
      service_type: 'website',
      service_label: 'Website',
      service_icon: 'https://www.gravatar.com/cache/images/icons/website.png',
      url: 'https://acmecorp.com',
      is_hidden: false,
    },
  ],
  languages: ['English'],
  is_organization: true,
  company: 'Acme Corporation',
  header_image: 'https://images.gravatar.com/userimages/3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d?size=600',
  hide_default_header_image: false,
  background_color: '#003366',
  links: [
    {
      label: 'Official Website',
      url: 'https://acmecorp.com',
    },
    {
      label: 'Careers',
      url: 'https://acmecorp.com/careers',
    },
  ],
  interests: [
    { id: 1, name: 'Technology', slug: '1-technology' },
    { id: 2, name: 'Innovation', slug: '2-innovation' },
  ],
  contact_info: {
    email: 'contact@acmecorp.com',
    websites: ['https://acmecorp.com'],
  },
  number_verified_accounts: 1,
  last_profile_edit: '2024-01-20T09:15:00Z',
  registration_date: '2015-03-10T11:30:00Z',
};

// ============================================================================
// API Response Mocks
// ============================================================================

export const mockResponses: Record<string, GravatarApiResponse> = {
  success: {
    data: mockFullProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },
  minimalSuccess: {
    data: mockMinimalProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },
  organizationSuccess: {
    data: mockOrganizationProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },
  notFound: {
    error: 'Profile not found',
    status: 404,
    headers: mockResponseHeaders.notFound,
  },
  rateLimited: {
    error: 'Rate limit exceeded. Please try again later.',
    status: 429,
    headers: mockResponseHeaders.rateLimited,
  },
  serverError: {
    error: 'Internal server error',
    status: 500,
    headers: mockResponseHeaders.serverError,
  },
  badRequest: {
    error: 'Invalid request parameters',
    status: 400,
    headers: mockResponseHeaders.serverError,
  },
  unauthorized: {
    error: 'Invalid API key',
    status: 401,
    headers: mockResponseHeaders.serverError,
  },
  forbidden: {
    error: 'Access forbidden',
    status: 403,
    headers: mockResponseHeaders.serverError,
  },
};

// ============================================================================
// Specialized Response Mocks for Testing
// ============================================================================

export const mockEdgeCaseResponses = {
  // Profile with no optional fields
  bareBonesProfile: {
    data: {
      hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      profile_url: 'https://gravatar.com/barebones',
      avatar_url: 'https://www.gravatar.com/avatar/9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      avatar_alt_text: 'Avatar',
      display_name: 'Bare Bones User',
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },

  // Profile with extremely long fields
  longFieldsProfile: {
    data: {
      ...mockFullProfile,
      display_name: 'A'.repeat(100),
      description: 'B'.repeat(500),
      location: 'C'.repeat(200),
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },

  // Profile with special characters
  specialCharsProfile: {
    data: {
      ...mockFullProfile,
      display_name: 'Jöhn Smïth 🚀',
      description: 'Special chars: àáâãäåæçèéêë ñòóôõö ùúûüý ÿ 中文 العربية',
      location: 'São Paulo, Brasil',
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },

  // Profile with maximum verified accounts
  maxVerifiedAccountsProfile: {
    data: {
      ...mockFullProfile,
      verified_accounts: Array.from({ length: 20 }, (_, i) => ({
        service_type: `service_${i}`,
        service_label: `Service ${i}`,
        service_icon: `https://example.com/icon${i}.png`,
        url: `https://example.com/user${i}`,
        is_hidden: i % 3 === 0,
      })),
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },

  // Profile with no verified accounts
  noVerifiedAccountsProfile: {
    data: {
      ...mockFullProfile,
      verified_accounts: [],
      number_verified_accounts: 0,
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },

  // Profile with maximum links
  maxLinksProfile: {
    data: {
      ...mockFullProfile,
      links: Array.from({ length: 15 }, (_, i) => ({
        label: `Link ${i + 1}`,
        url: `https://example.com/link${i + 1}`,
      })),
    } as GravatarProfile,
    status: 200,
    headers: mockResponseHeaders.success,
  },
};

// ============================================================================
// Image Response Mocks
// ============================================================================

export const mockImageResponses = {
  avatarSuccess: {
    data: Buffer.from('fake-avatar-image-data'),
    status: 200,
    headers: mockResponseHeaders.image,
  },

  avatarNotFound: {
    data: null,
    status: 404,
    headers: mockResponseHeaders.imageNotFound,
  },

  avatarServerError: {
    data: null,
    status: 500,
    headers: mockResponseHeaders.serverError,
  },
};

// ============================================================================
// Rate Limit Response Variations
// ============================================================================

export const mockRateLimitResponses = {
  // Near limit
  nearLimit: {
    error: 'Rate limit warning',
    status: 200,
    headers: {
      ...mockResponseHeaders.success,
      'X-Ratelimit-Remaining': '10',
    },
  },

  // At limit
  atLimit: {
    error: 'Rate limit exceeded',
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-Ratelimit-Limit': '1000',
      'X-Ratelimit-Remaining': '0',
      'X-Ratelimit-Reset': Math.floor(Date.now() / 1000 + 300).toString(),
      'Retry-After': '300',
    },
  },

  // Different limit values
  customLimit: {
    data: mockFullProfile,
    status: 200,
    headers: {
      ...mockResponseHeaders.success,
      'X-Ratelimit-Limit': '100',
      'X-Ratelimit-Remaining': '95',
    },
  },
};

// ============================================================================
// Mock Response Generators
// ============================================================================

/**
 * Generates a mock profile response with custom data
 */
export function generateMockProfileResponse(overrides: Partial<GravatarProfile> = {}): GravatarApiResponse {
  return {
    data: { ...mockFullProfile, ...overrides },
    status: 200,
    headers: mockResponseHeaders.success,
  };
}

/**
 * Generates a mock error response
 */
export function generateMockErrorResponse(
  error: string,
  status: number,
  headers?: Record<string, string>
): GravatarApiResponse {
  return {
    error,
    status,
    headers: headers || mockResponseHeaders.serverError,
  };
}

/**
 * Generates a mock rate-limited response
 */
export function generateRateLimitResponse(remaining: number, resetInSeconds: number = 300): GravatarApiResponse {
  return {
    error: 'Rate limit exceeded. Please try again later.',
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-Ratelimit-Limit': '1000',
      'X-Ratelimit-Remaining': remaining.toString(),
      'X-Ratelimit-Reset': Math.floor(Date.now() / 1000 + resetInSeconds).toString(),
      'Retry-After': resetInSeconds.toString(),
    },
  };
}

/**
 * Generates a profile with a specific number of verified accounts
 */
export function generateProfileWithVerifiedAccounts(count: number): GravatarApiResponse {
  const verifiedAccounts = Array.from({ length: count }, (_, i) => ({
    service_type: `service_${i}`,
    service_label: `Service ${i}`,
    service_icon: `https://example.com/icon${i}.png`,
    url: `https://example.com/user${i}`,
    is_hidden: false,
  }));

  return generateMockProfileResponse({
    verified_accounts: verifiedAccounts,
    number_verified_accounts: count,
  });
}

/**
 * Generates a profile with a specific number of links
 */
export function generateProfileWithLinks(count: number): GravatarApiResponse {
  const links = Array.from({ length: count }, (_, i) => ({
    label: `Link ${i + 1}`,
    url: `https://example.com/link${i + 1}`,
  }));

  return generateMockProfileResponse({ links });
}

// ============================================================================
// Export All Mocks
// ============================================================================

export const MOCK_RESPONSES = {
  mockResponseHeaders,
  mockFullProfile,
  mockMinimalProfile,
  mockOrganizationProfile,
  mockResponses,
  mockEdgeCaseResponses,
  mockImageResponses,
  mockRateLimitResponses,
  generateMockProfileResponse,
  generateMockErrorResponse,
  generateRateLimitResponse,
  generateProfileWithVerifiedAccounts,
  generateProfileWithLinks,
} as const;