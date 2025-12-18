// Do not write code directly here, instead use the `src` folder!
// Then, use this file to export everything you want your user to access.

// Components
export { default as GravatarAvatar } from './src/components/GravatarAvatar.astro';
export { default as GravatarProfileCard } from './src/components/GravatarProfileCard.astro';
export { default as GravatarQR } from './src/components/GravatarQR.astro';

// Utilities
export {
  buildAvatarUrl,
  buildProfileUrl,
  buildQRCodeUrl,
  getProfile,
  getProfiles,
  validateAvatarParams,
  getDefaultAvatarConfig,
  clearApiCache,
  getApiCacheStats,
} from './src/lib/gravatar.js';

// Advanced Client
export { GravatarClient } from './src/lib/GravatarClient.js';
export type {
  GravatarClientOptions,
  BatchOptions,
  ClientCacheStats,
  ClientRequestStats,
} from './src/lib/GravatarClient.js';

export {
  hashEmail,
  hashEmails,
  isValidEmail,
  normalizeEmail,
  extractHash,
  hashEmailWithCache,
  clearEmailHashCache,
  getEmailHashCacheStats,
} from './src/utils/hash.js';

// Types
export type {
  // Component Props
  GravatarAvatarProps,
  GravatarProfileCardProps,
  GravatarQRProps,
  GravatarConfig,

  // API Data Types
  GravatarProfile,
  Avatar,
  VerifiedAccount,
  Link,
  Interest,
  CryptoWalletAddress,
  ContactInfo,

  // Configuration Types
  GravatarClientConfig,
  GravatarApiResponse,
  RateLimitInfo,
  CacheEntry,
  CacheOptions,

  // Utility Types
  AvatarRating,
  DefaultAvatar,
  QRCodeVersion,
  QRCodeIcon,
  GravatarErrorCode,
} from './src/lib/types.js';

// Error Classes
export {
  GravatarError,
  GRAVATAR_ERROR_CODES,
} from './src/lib/types.js';

// Constants
export {
  GRAVATAR_AVATAR_BASE,
  GRAVATAR_API_BASE,
  GRAVATAR_QR_BASE,
  DEFAULT_AVATAR_SIZE,
  DEFAULT_AVATAR_RATING,
  DEFAULT_AVATAR_IMAGE,
  DEFAULT_TIMEOUT,
} from './src/lib/gravatar.js';

// Default export for backward compatibility
import GravatarAvatar from './src/components/GravatarAvatar.astro';
export default GravatarAvatar;
