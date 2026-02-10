# astro-gravatar

[![npm version](https://badge.fury.io/js/astro-gravatar.svg)](https://badge.fury.io/js/astro-gravatar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Astro components for integrating Gravatar avatars and profiles into your Astro site.

## ✨ Features

- 🎨 **Beautiful Components** - Ready-to-use avatar and profile card components
- 🚀 **Performance Optimized** - Built-in caching, lazy loading, and image optimization
- 🔒 **TypeScript Support** - Full type safety with comprehensive interfaces
- 🎭 **Customizable** - Extensive styling and layout options
- 📱 **Responsive** - Mobile-friendly with accessibility features
- 🌐 **SSR Compatible** - Works seamlessly with Astro's server-side rendering

## 🚀 Quick Start

### Installation

```bash
bun add astro-gravatar
```

### Basic Usage

```astro
---
import GravatarAvatar from 'astro-gravatar';
---

<GravatarAvatar email="user@example.com" size={120} />
```

### Profile Cards

```astro
---
import GravatarProfileCard from 'astro-gravatar/GravatarProfileCard';
---

<GravatarProfileCard
  email="user@example.com"
  layout="card"
  showVerified
  showLinks
/>
```

### QR Codes

```astro
---
import GravatarQR from 'astro-gravatar/GravatarQR';
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

## 📖 Documentation

- **[Quick Start Guide](../apps/astro-gravatar.and.guide/src/content/docs/guides/quick-start.mdx)** - Get up and running in minutes
- **[Component Reference](../apps/astro-gravatar.and.guide/src/content/docs/reference/components.md)** - Complete API documentation

## 🎯 Components

### GravatarAvatar

Display a Gravatar avatar with extensive customization:

```astro
<GravatarAvatar
  email="user@example.com"
  size={150}
  rating="pg"
  default="identicon"
  class="rounded-full"
  lazy={true}
/>
```

### GravatarProfileCard

Display a complete profile card with avatar and user information. Available in three template variations:

```astro
<!-- Default template (balanced display) -->
<GravatarProfileCard
  email="user@example.com"
  template="default"
  layout="horizontal"
  avatarSize={100}
  showName
  showBio
  showVerified
  showLinks
/>

<!-- Compact template (avatar + name only) -->
<GravatarProfileCard
  email="user@example.com"
  template="compact"
  layout="horizontal"
  avatarSize={40}
  clickable={true}
/>

<!-- Detailed template (full profile information) -->
<GravatarProfileCard
  email="user@example.com"
  template="detailed"
  layout="card"
  avatarSize={120}
  showName
  showBio
  showVerified
  showLinks
  maxLinks={5}
/>
```

### GravatarQR

Display a QR code that links to a user's Gravatar profile:

```astro
<GravatarQR
  email="user@example.com"
  size={150}
  version={3}
  type="gravatar"
  utmMedium="web"
  utmCampaign="profile_share"
  class="qr-code"
/>
```

## 🛠️ Utilities

Access the underlying utilities for custom implementations:

```astro
---
import { buildAvatarUrl, buildQRCodeUrl, getProfile } from 'astro-gravatar';

// Build custom avatar URL
const avatarUrl = await buildAvatarUrl('user@example.com', { size: 200 });

// Build QR code URL
const qrUrl = await buildQRCodeUrl('user@example.com', { size: 150, version: 3 });

// Fetch profile data
const profile = await getProfile('user@example.com');
---

<img src={avatarUrl} alt="User Avatar" />
<img src={qrUrl} alt="QR Code" />
<h1>{profile.display_name}</h1>
```

## 🎨 Styling

Components include sensible defaults but are fully customizable:

```css
/* Custom avatar styling */
.my-avatar {
  border-radius: 50%;
  border: 3px solid #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.my-avatar:hover {
  transform: scale(1.05);
}
```

## 🔧 Configuration

All components support extensive configuration options:

### Avatar Options
- `size` - Avatar size in pixels (1-2048)
- `rating` - Content rating level (g, pg, r, x)
- `default` - Default image for missing avatars
- `lazy` - Enable lazy loading

### Profile Card Options
- `layout` - Layout style (horizontal, vertical, card)
- `template` - Content template (default, compact, detailed)
- `showName`, `showBio`, `showVerified`, `showLinks` - Toggle content sections

### QR Code Options
- `size` - QR code size in pixels (1-1000, default: 80)
- `version` - QR code style version (1: standard, 3: modern dots)
- `type` - Center icon type (user, gravatar, none)
- `utmMedium` - UTM medium parameter for tracking
- `utmCampaign` - UTM campaign parameter for tracking

## 📝 TypeScript Support

Full TypeScript support with comprehensive types:

```ts
import type { GravatarProfile, GravatarAvatarProps } from 'astro-gravatar';

// Use types in your components
const profile: GravatarProfile = await getProfile('user@example.com');
```

## ⚠️ Error Handling

The library provides robust error handling through the `GravatarError` class and `GRAVATAR_ERROR_CODES` constant.

```typescript
import { GravatarError, GRAVATAR_ERROR_CODES } from 'astro-gravatar';

try {
  const profile = await getProfile('invalid-email');
} catch (error) {
  if (error instanceof GravatarError) {
    // Handle specific error codes
    if (error.code === GRAVATAR_ERROR_CODES.INVALID_EMAIL) {
      console.error('The provided email is invalid');
    } else if (error.code === GRAVATAR_ERROR_CODES.INVALID_RESPONSE) {
      console.error('Received an invalid response from Gravatar API');
    }
  }
}
```

Common error codes include `INVALID_EMAIL`, `INVALID_RESPONSE`, `RATE_LIMITED`, and `NOT_FOUND`.

## 🚀 Performance Features

- **Built-in Caching** - Reduces API calls and improves performance
- **Lazy Loading** - Images load only when needed
- **Responsive Images** - Automatic srcset generation
- **Optimized URLs** - Efficient Gravatar URL construction

## 🌍 Browser Support

- Modern browsers with ES6 module support
- Progressive enhancement for JavaScript-disabled environments
- Responsive design with accessibility features

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command       | Action                                                                                                                                                                                                                           |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun link`    | Registers this package locally. Run `bun link astro-gravatar` in an Astro project to install your components                                                                                                               |
| `bun publish` | [Publishes](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages#publishing-unscoped-public-packages) this package to NPM. Requires you to be [logged in](https://docs.npmjs.com/cli/v8/commands/bun-adduser) |
| `bun run typecheck` | Check TypeScript types without building                                                                                                                                                                                                 |

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## 🙏 Acknowledgments

- [Gravatar](https://gravatar.com/) for the avatar service
- [Astro](https://astro.build/) for the amazing framework
- The community for feedback and support
