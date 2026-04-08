# astro-gravatar

[![npm version](https://badge.fury.io/js/astro-gravatar.svg)](https://badge.fury.io/js/astro-gravatar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Astro components and utilities for Gravatar avatars, profile cards, and QR codes.

## Features

- Astro-native components for avatars, profile cards, and QR codes
- Bun-first helpers for profile fetching, hashing, caching, and URL generation
- Responsive image behavior, lazy loading, and SSR-friendly rendering
- Full TypeScript support for components, utilities, and client APIs
- Optional CLI for offline Gravatar avatar and QR URL generation

## Installation

```bash
bun add astro-gravatar
```

Supports Astro `^4.0.0 || ^5.0.0`.

## Quick start

### Basic avatar

```astro
---
import { GravatarAvatar } from 'astro-gravatar';
---

<GravatarAvatar email="user@example.com" size={120} />
```

### Profile card

```astro
---
import { GravatarProfileCard } from 'astro-gravatar';
---

<GravatarProfileCard
  email="user@example.com"
  template="detailed"
  layout="card"
  showVerified
  showLinks
/>
```

### QR code

```astro
---
import { GravatarQR } from 'astro-gravatar';
---

<GravatarQR
  email="user@example.com"
  size={150}
  version={3}
  type="gravatar"
  utmMedium="web"
  utmCampaign="profile_share"
/>
```

## Utilities

```astro
---
import {
  buildAvatarUrl,
  buildQRCodeUrl,
  getProfile,
  hashEmail,
  GravatarClient,
} from 'astro-gravatar';

const avatarUrl = await buildAvatarUrl('user@example.com', { size: 200 });
const qrUrl = await buildQRCodeUrl('user@example.com', { size: 150, version: 3 });
const profile = await getProfile('user@example.com');
const hash = await hashEmail('user@example.com');
const client = new GravatarClient();
---

<img src={avatarUrl} alt="User Avatar" />
<img src={qrUrl} alt="QR Code" />
<h1>{profile.display_name}</h1>
<p>{hash}</p>
```

## CLI

```bash
bunx astro-gravatar generate-avatar --email user@example.com --size 200
bunx astro-gravatar generate-qr --email user@example.com --size 180 --qr-version 3
```

## Export surface

- Components: `GravatarAvatar`, `GravatarProfileCard`, `GravatarQR`
- Utilities: `buildAvatarUrl`, `buildProfileUrl`, `buildQRCodeUrl`, `getProfile`, `getProfiles`
- Client: `GravatarClient`
- Hash helpers: `hashEmail`, `hashEmails`, `normalizeEmail`, `extractHash`
- Types and errors: `GravatarError`, `GRAVATAR_ERROR_CODES`, related TypeScript types

## Error handling

```ts
import { GravatarError, GRAVATAR_ERROR_CODES } from 'astro-gravatar';

try {
  await getProfile('invalid-email');
} catch (error) {
  if (error instanceof GravatarError) {
    if (error.code === GRAVATAR_ERROR_CODES.INVALID_EMAIL) {
      console.error('The provided email is invalid');
    }
  }
}
```

Common error codes include `INVALID_EMAIL`, `INVALID_RESPONSE`, `RATE_LIMITED`, and `NOT_FOUND`.

## Docs and links

- Documentation: https://astro-gravatar.and.guide
- Quick start: https://astro-gravatar.and.guide/guides/quick-start/
- Component reference: https://astro-gravatar.and.guide/reference/components/
- Utilities reference: https://astro-gravatar.and.guide/reference/utilities/
- npm: https://www.npmjs.com/package/astro-gravatar
- GitHub: https://github.com/imjlk/astro-gravatar
- Issues: https://github.com/imjlk/astro-gravatar/issues

## Quality checks

This package is tested with Bun and checked in CI for lint, format, type safety, coverage, pack output, and bundle size.

```bash
bun test
bun run test:coverage
```

## License

MIT
