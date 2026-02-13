/**
 * Core types for the astro-gravatar component library
 * Based on Gravatar API v3 specification
 */

// ============================================================================
// Gravatar API Data Types
// ============================================================================

/** User profile information from Gravatar API */
export interface GravatarProfile {
  /** SHA256 hash of the user's primary email address */
  hash: string;
  /** Full URL for the user's profile */
  profile_url: string;
  /** URL for the user's avatar image */
  avatar_url: string;
  /** Alt text for the user's avatar image */
  avatar_alt_text: string;
  /** User's display name */
  display_name: string;
  /** User's pronouns */
  pronouns?: string;
  /** User's location */
  location?: string;
  /** User's job title */
  job_title?: string;
  /** User's current company name */
  company?: string;
  /** About section on user's profile */
  description?: string;
  /** List of verified accounts */
  verified_accounts?: VerifiedAccount[];
  /** Phonetic pronunciation of user's name */
  pronunciation?: string;
  /** User's timezone */
  timezone?: string;
  /** Languages the user knows */
  languages?: string[];
  /** User's first name */
  first_name?: string;
  /** User's last name */
  last_name?: string;
  /** Whether user is an organization */
  is_organization?: boolean;
  /** Header image used in profile card */
  header_image?: string;
  /** Whether to hide the default header image */
  hide_default_header_image?: boolean;
  /** Profile background color */
  background_color?: string;
  /** List of links added to profile */
  links?: Link[];
  /** List of interests added to profile */
  interests?: Interest[];
  /** User's public payment information */
  payments?: CryptoWalletAddress[];
  /** User's contact information */
  contact_info?: ContactInfo;
  /** Additional images uploaded by user */
  gallery?: Avatar[];
  /** Count of verified accounts */
  number_verified_accounts?: number;
  /** When user last edited profile */
  last_profile_edit?: string;
  /** When user registered account */
  registration_date?: string;
}

/** An avatar that a user has uploaded to their Gravatar account */
export interface Avatar {
  /** Unique identifier for the image */
  image_id: string;
  /** Image URL */
  image_url: string;
  /** Rating associated with image (G, PG, R, X) */
  rating: AvatarRating;
  /** Alternative text description of image */
  alt_text: string;
  /** Whether image is currently selected */
  selected: boolean;
  /** Date and time when image was last updated */
  updated_date?: string;
}

/** A verified account on a user's profile */
export interface VerifiedAccount {
  /** Type of service */
  service_type: string;
  /** Name of service */
  service_label: string;
  /** URL to service's icon */
  service_icon: string;
  /** URL to user's profile on service */
  url: string;
  /** Whether account is hidden from profile */
  is_hidden: boolean;
}

/** A link added to a user's profile */
export interface Link {
  /** Label for the link */
  label: string;
  /** URL to the link */
  url: string;
}

/** An interest added to a user's profile */
export interface Interest {
  /** Unique identifier for interest */
  id: number;
  /** Name of interest */
  name: string;
  /** Slug representing the interest by combining id and its normalized name */
  slug: string;
}

/** A cryptocurrency wallet address the user accepts */
export interface CryptoWalletAddress {
  /** Label for the cryptocurrency */
  label: string;
  /** Wallet address for the cryptocurrency */
  address: string;
}

/** User's contact information */
export interface ContactInfo {
  /** Primary email address */
  email?: string;
  /** Additional email addresses */
  emails?: string[];
  /** Phone numbers */
  phone_numbers?: string[];
  /** Website URLs */
  websites?: string[];
}

// ============================================================================
// Component Props and Configuration
// ============================================================================

/** Avatar rating levels for content filtering */
export type AvatarRating = 'g' | 'pg' | 'r' | 'x';

/** Default avatar options when no avatar is found */
export type DefaultAvatar =
  | '404' // Return 404 if not found
  | 'mp' // Mystery person (simple, cartoon-style silhouetted outline of a person)
  | 'identicon' // Geometric pattern based on email hash
  | 'monsterid' // Generated 'monster' with different colors and faces
  | 'wavatar' // Generated faces with differing features and backgrounds
  | 'retro' // Awesome generated 8-bit arcade-style pixelated faces
  | 'robohash' // Generated robot with different colors, faces, etc
  | 'blank' // Transparent PNG image
  | string; // Custom URL

/** QR code style versions */
export type QRCodeVersion = 1 | 3;

/** QR code center icon types */
export type QRCodeIcon = 'user' | 'gravatar' | 'none';

/** Props for GravatarAvatar component */
export interface GravatarAvatarProps {
  /** Email address to generate avatar for */
  email: string;
  /** Avatar size in pixels (1-2048) */
  size?: number;
  /** Maximum rating level allowed */
  rating?: AvatarRating;
  /** Default image to use when no avatar is found */
  default?: DefaultAvatar;
  /** Whether to force default image */
  forceDefault?: boolean;
  /** CSS class for the avatar image */
  class?: string;
  /** Alt text for the image */
  alt?: string;
  /** Whether to enable lazy loading */
  lazy?: boolean;
  /** Custom CSS attributes */
  [key: `data-${string}`]: string | number | boolean | undefined;
}

/** Props for GravatarProfileCard component */
export interface GravatarProfileCardProps {
  /** Email address to display profile for */
  email: string;
  /** Avatar size in pixels */
  avatarSize?: number;
  /** Layout style */
  layout?: 'horizontal' | 'vertical' | 'card';
  /** Whether to show the display name */
  showName?: boolean;
  /** Whether to show the bio/description */
  showBio?: boolean;
  /** Whether to show verified accounts */
  showVerified?: boolean;
  /** Whether to show social links */
  showLinks?: boolean;
  /** Maximum number of links to show */
  maxLinks?: number;
  /** CSS class for the card container */
  class?: string;
  /** Whether to make the profile clickable */
  clickable?: boolean;
  /** Custom template for profile data */
  template?: 'default' | 'compact' | 'detailed';
}

/** Props for GravatarQR component */
export interface GravatarQRProps {
  /** Email address to generate QR code for */
  email: string;
  /** QR code size in pixels (default: 80) */
  size?: number;
  /** QR code style version (1: standard, 3: modern dots) */
  version?: QRCodeVersion;
  /** Center icon type */
  type?: QRCodeIcon;
  /** UTM medium parameter */
  utmMedium?: string;
  /** UTM campaign parameter */
  utmCampaign?: string;
  /** CSS class for the QR code image */
  class?: string;
  /** Alt text for the QR code */
  alt?: string;
}

/** Global configuration for GravatarProvider */
export interface GravatarConfig {
  /** Gravatar API key for enhanced profile features */
  apiKey?: string;
  /** Default avatar size */
  defaultSize?: number;
  /** Default avatar rating */
  defaultRating?: AvatarRating;
  /** Default avatar image */
  defaultAvatar?: DefaultAvatar;
  /** Base URL for Gravatar API (for proxy/CDN usage) */
  baseUrl?: string;
  /** Cache configuration */
  cache?: {
    /** Time-to-live in seconds */
    ttl?: number;
    /** Maximum number of cached items */
    maxSize?: number;
  };
  /** Default locale for profile requests */
  locale?: string;
}

// ============================================================================
// API Client Types
// ============================================================================

/** Gravatar API client configuration */
export interface GravatarClientConfig {
  /** API key for authenticated requests */
  apiKey?: string;
  /** Base URL for API requests */
  baseUrl?: string;
  /** Default timeout for requests in milliseconds */
  timeout?: number;
  /** Custom headers to send with requests */
  headers?: Record<string, string>;
}

/** API response wrapper */
export interface GravatarApiResponse<T = unknown> {
  /** Response data */
  data?: T;
  /** Error message if request failed */
  error?: string;
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: Record<string, string>;
}

/** Rate limit information from API response headers */
export interface RateLimitInfo {
  /** Total requests allowed in current period */
  limit: number;
  /** Remaining requests in current period */
  remaining: number;
  /** Unix timestamp when the limit resets */
  reset: number;
}

// ============================================================================
// Cache Types
// ============================================================================

/** Cache entry with expiration */
export interface CacheEntry<T = unknown> {
  /** Cached data */
  data: T;
  /** Expiration timestamp */
  expires: number;
  /** Creation timestamp */
  created: number;
  /** Number of times this entry was accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccess: number;
}

/** Cache configuration options */
export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Maximum number of items to store */
  maxSize?: number;
  /** Whether to update access time on get */
  updateAccessOnGet?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/** Custom error class for Gravatar-related errors */
export class GravatarError extends Error {
  /** Error code */
  code: string;
  /** HTTP status code */
  status?: number;
  /** Rate limit information */
  rateLimit?: RateLimitInfo;

  constructor(message: string, code?: string, status?: number, rateLimit?: RateLimitInfo) {
    super(message);
    this.name = 'GravatarError';
    this.code = code || 'UNKNOWN_ERROR';
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

/** Common error codes */
export const GRAVATAR_ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  HASH_ERROR: 'HASH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
} as const;

export type GravatarErrorCode = (typeof GRAVATAR_ERROR_CODES)[keyof typeof GRAVATAR_ERROR_CODES];
