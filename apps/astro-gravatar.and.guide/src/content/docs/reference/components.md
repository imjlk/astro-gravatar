---
title: Component Reference
description: Complete API reference for all astro-gravatar components
---

import { Code } from '@astrojs/starlight/components';

# Component Reference

Complete API reference for all astro-gravatar components and utilities.

## Components

### GravatarAvatar

Display a Gravatar avatar with extensive customization options.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `email` | `string` | **Required** | Email address to generate avatar for |
| `size` | `number` | `80` | Avatar size in pixels (1-2048) |
| `rating` | `'g' \| 'pg' \| 'r' \| 'x'` | `'g'` | Maximum rating level allowed |
| `default` | `DefaultAvatar` | `'mp'` | Default image for missing avatars |
| `forceDefault` | `boolean` | `false` | Whether to force default image |
| `class` | `string` | `''` | CSS class for the avatar image |
| `alt` | `string` | `Avatar for {email}` | Alt text for the image |
| `lazy` | `boolean` | `false` | Whether to enable lazy loading |

#### Examples

**Basic Usage**

```astro
<GravatarAvatar email="user@example.com" />
```

**Custom Size and Style**

```astro
<GravatarAvatar
  email="user@example.com"
  size={120}
  rating="pg"
  default="identicon"
  class="rounded-full border-2 border-blue-500"
/>
```

**Lazy Loading**

```astro
<GravatarAvatar
  email="user@example.com"
  size={200}
  lazy={true}
  alt="Profile picture"
/>
```

#### CSS Classes

The component applies these base classes that you can override:

- `.gravatar-avatar` - Base avatar class
- `.rounded` - Slightly rounded corners (add via `class` prop)
- `.rounded-full` - Fully circular (add via `class` prop)

---

### GravatarProfileCard

Display a combined avatar and profile card with rich user information.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `email` | `string` | **Required** | Email address to display profile for |
| `avatarSize` | `number` | `80` | Avatar size in pixels |
| `layout` | `'horizontal' \| 'vertical' \| 'card'` | `'card'` | Layout style |
| `showName` | `boolean` | `true` | Whether to show the display name |
| `showBio` | `boolean` | `true` | Whether to show the bio/description |
| `showVerified` | `boolean` | `true` | Whether to show verified accounts |
| `showLinks` | `boolean` | `true` | Whether to show social links |
| `maxLinks` | `number` | `3` | Maximum number of links to show |
| `class` | `string` | `''` | CSS class for the card container |
| `clickable` | `boolean` | `false` | Whether to make the profile clickable |
| `template` | `'default' \| 'compact' \| 'detailed'` | `'default'` | Content template style |

#### Examples

**Basic Profile Card**

```astro
<GravatarProfileCard
  email="user@example.com"
  layout="card"
/>
```

**Horizontal Layout with Verification**

```astro
<GravatarProfileCard
  email="user@example.com"
  layout="horizontal"
  avatarSize={100}
  showVerified={true}
  clickable={true}
/>
```

**Compact Template**

```astro
<GravatarProfileCard
  email="user@example.com"
  layout="vertical"
  template="compact"
  maxLinks={5}
/>
```

**Detailed Template**

```astro
<GravatarProfileCard
  email="user@example.com"
  template="detailed"
  showBio={true}
  showLinks={true}
  showVerified={true}
/>
```

#### CSS Classes

- `.gravatar-profile-card` - Base card class
- `.gravatar-profile-card--{layout}` - Layout-specific class
- `.gravatar-profile-card--{template}` - Template-specific class
- `.gravatar-profile-card--clickable` - Clickable card style

---

## Utilities

### Email Hashing

#### `hashEmail(email: string): string`

Creates a SHA256 hash of an email address for Gravatar API usage.

```ts
import { hashEmail } from 'astro-gravatar';

const hash = await hashEmail('user@example.com');
console.log(hash); // '27205e5c51cb03f862138b22bcb5dc20f94a342e744ff6df1b8dc8af3c865109'
```

#### `isValidEmail(email: string): boolean`

Validates an email address format.

```ts
import { isValidEmail } from 'astro-gravatar';

console.log(isValidEmail('user@example.com')); // true
console.log(isValidEmail('invalid-email')); // false
```

#### `hashEmails(emails: string[]): string[]`

Batch hash multiple email addresses.

```ts
import { hashEmails } from 'astro-gravatar';

const hashes = await hashEmails([
  'user1@example.com',
  'user2@example.com'
]);
```

---

### URL Building

#### `buildAvatarUrl(email, options?): string`

Builds a complete Gravatar avatar URL.

```ts
import { buildAvatarUrl } from 'astro-gravatar';

const url = await buildAvatarUrl('user@example.com', {
  size: 200,
  rating: 'pg',
  default: 'identicon'
});
```

#### `buildProfileUrl(email, config?): string`

Builds a Gravatar profile API URL.

```ts
import { buildProfileUrl } from 'astro-gravatar';

const url = await buildProfileUrl('user@example.com', {
  apiKey: 'your-api-key'
});
```

#### `buildQRCodeUrl(email, options?): string`

Builds a QR code URL for a Gravatar profile.

```ts
import { buildQRCodeUrl } from 'astro-gravatar';

const url = await buildQRCodeUrl('user@example.com', {
  size: 300,
  version: 3,
  type: 'user'
});
```

---

### Profile Data

#### `getProfile(email, config?): Promise<GravatarProfile>`

Fetches complete profile data from the Gravatar API.

```ts
import { getProfile } from 'astro-gravatar';

try {
  const profile = await getProfile('user@example.com', {
    apiKey: 'your-api-key' // Optional
  });

  console.log(profile.display_name);
  console.log(profile.avatar_url);
} catch (error) {
  console.error('Failed to fetch profile:', error);
}
```

#### `getProfiles(emails, config?): Promise<GravatarProfile[]>`

Fetches multiple profiles in parallel.

```ts
import { getProfiles } from 'astro-gravatar';

const profiles = await getProfiles([
  'user1@example.com',
  'user2@example.com'
]);
```

---

## Type Definitions

### GravatarProfile

```ts
interface GravatarProfile {
  hash: string;
  profile_url: string;
  avatar_url: string;
  avatar_alt_text: string;
  display_name: string;
  pronouns?: string;
  location?: string;
  job_title?: string;
  company?: string;
  description?: string;
  verified_accounts?: VerifiedAccount[];
  links?: Link[];
  interests?: Interest[];
  // ... additional fields
}
```

### DefaultAvatar Type

```ts
type DefaultAvatar =
  | '404'           // Return 404 if not found
  | 'mp'           // Mystery person
  | 'identicon'    // Geometric pattern
  | 'monsterid'    // Generated monster
  | 'wavatar'      // Generated faces
  | 'retro'        // 8-bit arcade-style
  | 'robohash'     // Generated robot
  | 'blank'        // Transparent PNG
  | string;        // Custom URL
```

### AvatarRating Type

```ts
type AvatarRating = 'g' | 'pg' | 'r' | 'x';
```

---

## Error Handling

### GravatarError

All API errors throw a `GravatarError` with detailed information:

```ts
import { GravatarError, GRAVATAR_ERROR_CODES } from 'astro-gravatar';

try {
  await getProfile('user@example.com');
} catch (error) {
  if (error instanceof GravatarError) {
    console.log('Error code:', error.code);
    console.log('Status:', error.status);
    console.log('Message:', error.message);

    if (error.code === GRAVATAR_ERROR_CODES.RATE_LIMITED) {
      console.log('Rate limit info:', error.rateLimit);
    }
  }
}
```

### Error Codes

- `INVALID_EMAIL` - Invalid email format
- `HASH_ERROR` - Email hashing failed
- `NOT_FOUND` - Profile not found
- `RATE_LIMITED` - API rate limit exceeded
- `API_ERROR` - Generic API error
- `NETWORK_ERROR` - Network request failed
- `AUTH_ERROR` - Authentication failed
- `INVALID_RESPONSE` - Invalid API response

---

## Constants

```ts
import {
  GRAVATAR_AVATAR_BASE,    // 'https://0.gravatar.com/avatar'
  GRAVATAR_API_BASE,       // 'https://api.gravatar.com/v3'
  DEFAULT_AVATAR_SIZE,     // 80
  DEFAULT_AVATAR_RATING,   // 'g'
  DEFAULT_AVATAR_IMAGE,    // 'mp'
  DEFAULT_TIMEOUT          // 10000 (ms)
} from 'astro-gravatar';
```

---

## Performance Tips

1. **Use Caching**: Built-in caching reduces API calls
2. **Lazy Loading**: Enable lazy loading for avatar images
3. **Appropriate Sizes**: Use the smallest size needed
4. **Batch Requests**: Use `getProfiles()` for multiple users

```astro
<!-- Good practice for performance -->
<GravatarAvatar
  email="user@example.com"
  size={80}           // Don't oversized
  lazy={true}         // Enable lazy loading
  default="identicon" // Fallback prevents 404s
/>
```

---

## Browser Support

- Modern browsers with ES6 module support
- Automatically includes polyfills for older browsers
- Progressive enhancement for JavaScript-disabled environments

---

## Migration from Other Libraries

### From gravatar.js

```ts
// Before (gravatar.js)
const url = gravatar.url('user@example.com', { s: 200, r: 'pg', d: 'identicon' });

// After (astro-gravatar)
import { buildAvatarUrl } from 'astro-gravatar';
const url = await buildAvatarUrl('user@example.com', { size: 200, rating: 'pg', default: 'identicon' });
```

### From react-gravatar

```jsx
// Before (react-gravatar)
<Gravatar email="user@example.com" size={200} rating="pg" default="identicon" />

// After (astro-gravatar)
<GravatarAvatar email="user@example.com" size={200} rating="pg" default="identicon" />
```