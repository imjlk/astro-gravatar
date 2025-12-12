/**
 * Test fixtures for astro-gravatar package
 * Contains sample data for testing various scenarios
 */

import type {
  GravatarAvatarProps,
  GravatarProfileCardProps,
  GravatarQRProps,
  GravatarConfig,
  AvatarRating,
  DefaultAvatar,
  QRCodeVersion,
  QRCodeIcon,
} from '../lib/types';

// ============================================================================
// Email Fixtures
// ============================================================================

export const VALID_EMAILS = [
  'john.doe@example.com',
  'user+tag@domain.org',
  'firstname.lastname@company.co.uk',
  '12345@numeric.com',
  'user.name.with.dots@domain.com',
  'user+alias@gmail.com',
] as const;

export const INVALID_EMAILS = [
  'invalid-email',
  '@domain.com',
  'user@',
  'user@.com',
  'user@domain.',
  'user name@domain.com',
] as const;

export const EDGE_CASE_EMAILS = [
  '', // Empty email
  ' ', // Space only
  'a@b.co', // Shortest valid email
  'very.long.email.address@very.long.domain.name.com', // Very long email
  'UPPERCASE@DOMAIN.COM', // Uppercase
] as const;

// ============================================================================
// Props Fixtures
// ============================================================================

export const GRAVATAR_AVATAR_PROPS: Record<string, GravatarAvatarProps> = {
  default: {
    email: 'john.doe@example.com',
  },
  withSize: {
    email: 'john.doe@example.com',
    size: 128,
  },
  withRating: {
    email: 'john.doe@example.com',
    rating: 'pg',
  },
  withDefault: {
    email: 'john.doe@example.com',
    default: 'mp',
  },
  withCustomDefault: {
    email: 'john.doe@example.com',
    default: 'https://example.com/default-avatar.png',
  },
  withForceDefault: {
    email: 'john.doe@example.com',
    forceDefault: true,
  },
  withCustomClass: {
    email: 'john.doe@example.com',
    class: 'custom-avatar-class',
  },
  withAltText: {
    email: 'john.doe@example.com',
    alt: 'Profile picture for John Doe',
  },
  withLazyLoading: {
    email: 'john.doe@example.com',
    lazy: true,
  },
  withDataAttributes: {
    email: 'john.doe@example.com',
    'data-user-id': '12345',
    'data-testid': 'user-avatar',
  },
  complete: {
    email: 'john.doe@example.com',
    size: 256,
    rating: 'g',
    default: 'identicon',
    forceDefault: false,
    class: 'avatar img-circle',
    alt: 'John Doe\'s avatar',
    lazy: true,
    'data-testid': 'user-avatar',
    'data-user-email': 'john.doe@example.com',
  },
};

export const GRAVATAR_PROFILE_CARD_PROPS: Record<string, GravatarProfileCardProps> = {
  default: {
    email: 'john.doe@example.com',
  },
  horizontalLayout: {
    email: 'john.doe@example.com',
    layout: 'horizontal',
  },
  verticalLayout: {
    email: 'john.doe@example.com',
    layout: 'vertical',
  },
  cardLayout: {
    email: 'john.doe@example.com',
    layout: 'card',
  },
  withCustomAvatarSize: {
    email: 'john.doe@example.com',
    avatarSize: 64,
  },
  hideName: {
    email: 'john.doe@example.com',
    showName: false,
  },
  hideBio: {
    email: 'john.doe@example.com',
    showBio: false,
  },
  hideVerified: {
    email: 'john.doe@example.com',
    showVerified: false,
  },
  hideLinks: {
    email: 'john.doe@example.com',
    showLinks: false,
  },
  limitedLinks: {
    email: 'john.doe@example.com',
    maxLinks: 3,
  },
  clickable: {
    email: 'john.doe@example.com',
    clickable: true,
  },
  compactTemplate: {
    email: 'john.doe@example.com',
    template: 'compact',
  },
  detailedTemplate: {
    email: 'john.doe@example.com',
    template: 'detailed',
  },
  complete: {
    email: 'john.doe@example.com',
    avatarSize: 128,
    layout: 'horizontal',
    showName: true,
    showBio: true,
    showVerified: true,
    showLinks: true,
    maxLinks: 5,
    class: 'profile-card',
    clickable: true,
    template: 'default',
  },
};

export const GRAVATAR_QR_PROPS: Record<string, GravatarQRProps> = {
  default: {
    email: 'john.doe@example.com',
  },
  withSize: {
    email: 'john.doe@example.com',
    size: 128,
  },
  version1: {
    email: 'john.doe@example.com',
    version: 1,
  },
  version3: {
    email: 'john.doe@example.com',
    version: 3,
  },
  withUserIcon: {
    email: 'john.doe@example.com',
    type: 'user',
  },
  withGravatarIcon: {
    email: 'john.doe@example.com',
    type: 'gravatar',
  },
  noIcon: {
    email: 'john.doe@example.com',
    type: 'none',
  },
  withUtmParams: {
    email: 'john.doe@example.com',
    utmMedium: 'qr_code',
    utmCampaign: 'profile_sharing',
  },
  withCustomClass: {
    email: 'john.doe@example.com',
    class: 'qr-code',
  },
  withAltText: {
    email: 'john.doe@example.com',
    alt: 'QR code for John Doe\'s Gravatar profile',
  },
  complete: {
    email: 'john.doe@example.com',
    size: 200,
    version: 3,
    type: 'user',
    utmMedium: 'qr_code',
    utmCampaign: 'profile_sharing',
    class: 'profile-qr',
    alt: 'Scan to view John Doe\'s Gravatar profile',
  },
};

// ============================================================================
// Configuration Fixtures
// ============================================================================

export const GRAVATAR_CONFIGS: Record<string, GravatarConfig> = {
  minimal: {
    apiKey: undefined,
  },
  withApiKey: {
    apiKey: 'test-api-key-12345',
  },
  withDefaults: {
    apiKey: 'test-api-key-12345',
    defaultSize: 128,
    defaultRating: 'pg',
    defaultAvatar: 'identicon',
  },
  withBaseUrl: {
    apiKey: 'test-api-key-12345',
    baseUrl: 'https://cdn.gravatar.com',
  },
  withCache: {
    apiKey: 'test-api-key-12345',
    cache: {
      ttl: 3600,
      maxSize: 100,
    },
  },
  withLocale: {
    apiKey: 'test-api-key-12345',
    locale: 'en-US',
  },
  complete: {
    apiKey: 'test-api-key-12345',
    defaultSize: 256,
    defaultRating: 'g',
    defaultAvatar: 'mp',
    baseUrl: 'https://secure.gravatar.com',
    cache: {
      ttl: 7200,
      maxSize: 200,
    },
    locale: 'en-US',
  },
};

// ============================================================================
// Enum Value Fixtures
// ============================================================================

export const AVATAR_RATINGS: AvatarRating[] = ['g', 'pg', 'r', 'x'];

export const DEFAULT_AVATARS: DefaultAvatar[] = [
  '404',
  'mp',
  'identicon',
  'monsterid',
  'wavatar',
  'retro',
  'robohash',
  'blank',
];

export const CUSTOM_DEFAULT_AVATARS = [
  'https://example.com/default1.png',
  'https://example.com/default2.jpg',
  'https://cdn.example.com/avatars/default.svg',
];

export const QR_CODE_VERSIONS: QRCodeVersion[] = [1, 3];

export const QR_CODE_ICONS: QRCodeIcon[] = ['user', 'gravatar', 'none'];

// ============================================================================
// Size and Dimension Fixtures
// ============================================================================

export const VALID_SIZES = [1, 32, 64, 128, 256, 512, 1024, 2048];

export const INVALID_SIZES = [0, -1, 2049, 5000];

export const COMMON_SIZES = {
  small: 32,
  medium: 64,
  large: 128,
  xlarge: 256,
};

// ============================================================================
// Edge Case and Error Scenario Fixtures
// ============================================================================

export const ERROR_SCENARIOS = {
  noEmail: null,
  emptyEmail: '',
  whitespaceEmail: '   ',
  invalidEmail: 'not-an-email',
  domainOnly: '@example.com',
  localOnly: 'user@',
  multipleAt: 'user@@example.com',
  leadingDot: '.user@example.com',
  trailingDot: 'user@example.com.',
  consecutiveDots: 'user..name@example.com',
  invalidChars: 'user name@example.com',
  veryLongEmail: 'a'.repeat(245) + '@example.com', // Exceeds 254 char limit
};

export const NETWORK_SCENARIOS = {
  timeout: 'timeout',
  rateLimit: 'rate_limited',
  serverError: 'server_error',
  networkError: 'network_error',
  invalidResponse: 'invalid_response',
};

// ============================================================================
// Component Rendering Fixtures
// ============================================================================

export const RENDERING_CONTEXTS = {
  browser: 'browser',
  server: 'server',
  static: 'static',
  development: 'development',
  production: 'production',
};

export const CSS_CLASS_FIXTURES = {
  simple: 'avatar',
  multiple: 'avatar rounded shadow',
  withTailwind: 'w-16 h-16 rounded-full',
  withBootstrap: 'img-thumbnail rounded-circle',
  custom: 'my-custom-avatar-class',
};

export const DATA_ATTRIBUTE_FIXTURES = {
  simple: { 'data-testid': 'avatar' },
  complex: {
    'data-testid': 'user-avatar',
    'data-user-id': '12345',
    'data-user-email': 'john.doe@example.com',
    'data-size': '128',
  },
};

// ============================================================================
// URL Generation Fixtures
// ============================================================================

export const URL_GENERATION_CASES = [
  {
    email: 'simple@example.com',
    expectedHash: 'b58996c504c5638798eb6b511e6f49af',
  },
  {
    email: 'UPPERCASE@DOMAIN.COM',
    expectedHash: 'b58996c504c5638798eb6b511e6f49af',
  },
  {
    email: 'user+tag@example.com',
    expectedHash: '4b24d812a49b674f8736e09875d86166',
  },
];

export const URL_PARAM_FIXTURES = [
  {
    params: { size: 128 },
    expectedParam: 's=128',
  },
  {
    params: { rating: 'pg' },
    expectedParam: 'r=pg',
  },
  {
    params: { default: 'mp' },
    expectedParam: 'd=mp',
  },
  {
    params: { forceDefault: true },
    expectedParam: 'f=y',
  },
  {
    params: { size: 256, rating: 'g', default: 'identicon' },
    expectedParam: 's=256&r=g&d=identicon',
  },
];

// ============================================================================
// Export All Fixtures
// ============================================================================

export const FIXTURES = {
  VALID_EMAILS,
  INVALID_EMAILS,
  EDGE_CASE_EMAILS,
  GRAVATAR_AVATAR_PROPS,
  GRAVATAR_PROFILE_CARD_PROPS,
  GRAVATAR_QR_PROPS,
  GRAVATAR_CONFIGS,
  AVATAR_RATINGS,
  DEFAULT_AVATARS,
  QR_CODE_VERSIONS,
  QR_CODE_ICONS,
  VALID_SIZES,
  INVALID_SIZES,
  COMMON_SIZES,
  ERROR_SCENARIOS,
  NETWORK_SCENARIOS,
  RENDERING_CONTEXTS,
  CSS_CLASS_FIXTURES,
  DATA_ATTRIBUTE_FIXTURES,
  URL_GENERATION_CASES,
  URL_PARAM_FIXTURES,
} as const;