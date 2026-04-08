# astro-gravatar

Monorepo for the [`astro-gravatar`](https://www.npmjs.com/package/astro-gravatar) package and its documentation site.

[![npm version](https://badge.fury.io/js/astro-gravatar.svg)](https://badge.fury.io/js/astro-gravatar)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-black.svg)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`astro-gravatar` provides Astro-native components and utilities for Gravatar avatars, profile cards, and QR codes. The publishable package lives in `packages/astro-gravatar` and the public docs site lives in `apps/astro-gravatar.and.guide`.

## Highlights

- Astro component package with named exports and subpath imports
- Bun-first utilities, hashing helpers, and `GravatarClient`
- Documentation site built with Astro + Starlight
- CI checks for lint, format, type safety, coverage, pack output, bundle size, and security audit

## Package installation

```bash
bun add astro-gravatar
```

## Quick start

### Basic avatar

```astro
---
import { GravatarAvatar } from 'astro-gravatar';
---

<GravatarAvatar email="user@example.com" size={80} />
```

### Profile card

```astro
---
import GravatarProfileCard from 'astro-gravatar/GravatarProfileCard';
---

<GravatarProfileCard
  email="developer@example.com"
  template="detailed"
  layout="card"
  showVerified
  showLinks
/>
```

### QR code

```astro
---
import GravatarQR from 'astro-gravatar/GravatarQR';
---

<GravatarQR email="user@example.com" size={200} version={3} type="gravatar" />
```

## Project structure

```text
astro-gravatar/
├── packages/
│   └── astro-gravatar/             # Published npm package
├── apps/
│   └── astro-gravatar.and.guide/   # Documentation site
├── scripts/                        # Repo tooling
└── .github/workflows/              # CI + publish workflows
```

## Development

### Prerequisites

- Bun `>=1.0.0`
- Node.js `>=22.0.0` for tooling compatibility

### Setup

```bash
git clone git@github.com:imjlk/astro-gravatar.git
cd astro-gravatar
bun install
```

### Common commands

```bash
bun run dev
bun run lint
bun run format:check
bun run typecheck
bun run test
bun run test:coverage
bun run build
bun run release:check
bun run sampo:add
bun run sampo:preview
bun run sampo:release
```

## Documentation

- Docs: https://astro-gravatar.and.guide
- Quick start: https://astro-gravatar.and.guide/guides/quick-start/
- Component reference: https://astro-gravatar.and.guide/reference/components/
- Utilities reference: https://astro-gravatar.and.guide/reference/utilities/
- API endpoints: https://astro-gravatar.and.guide/reference/api-endpoints/

## Release workflow

This repo uses Bun for local validation, Sampo for release metadata preparation, and a single GitHub Actions workflow for actual npm publishing.

1. Run `bun run release:check`.
2. Add a Sampo release entry when the published package changes: `bun run sampo:add`.
3. Run `bun run sampo:preview` if you want to inspect the planned version bump before changing files.
4. Run `bun run sampo:release` to consume pending release entries and update version/changelog metadata.
5. Review the resulting package version and `packages/astro-gravatar/CHANGELOG.md`.
6. Push the release-prepared commit to `main`. `.github/workflows/release.yml` will publish to npm with OIDC when the committed package version is newer than npm, then create the `v<version>` tag automatically.

### Workflow responsibilities

- `.github/workflows/release.yml` is the single release automation workflow.
- It compares the committed package version against the current npm dist-tag, runs release checks, publishes to npm with Trusted Publishing (OIDC), and creates the `v<version>` git tag when needed.
- npm Trusted Publishing for `astro-gravatar` must point at `.github/workflows/release.yml`.
- `.github/workflows/sampo-bot.yml` leaves a PR reminder when publishable package source changes without a `.sampo/changesets/*.md` entry. Add `skip-changeset`, `no-changeset`, or `release:skip` when a release entry is intentionally unnecessary.

### Astro directory listing

- `astro-gravatar` is published as an Astro component package, not an `astro add` integration.
- After a new npm version is published, Astro's integrations/components directory can pick it up from npm metadata such as `name`, `description`, `homepage`, `repository`, and ecosystem keywords.
- If the listing needs a custom avatar or metadata override after publish, open an issue with the Astro team using the live npm package as the source of truth.

## License

MIT

## Links

- npm package: https://www.npmjs.com/package/astro-gravatar
- Documentation: https://astro-gravatar.and.guide
- GitHub repository: https://github.com/imjlk/astro-gravatar
- Issues: https://github.com/imjlk/astro-gravatar/issues
