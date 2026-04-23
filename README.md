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
bun run build:package
bun run docs:build
bun run build
bun run pages:check
bun run pages:dev
bun run pages:deploy
bun run pages:deploy:preview
bun run release:check
bun run sampo:add
bun run sampo:preview
```

## Documentation

- Docs: https://astro-gravatar.and.guide
- Quick start: https://astro-gravatar.and.guide/guides/quick-start/
- CLI guide: https://astro-gravatar.and.guide/guides/cli/
- Component reference: https://astro-gravatar.and.guide/reference/components/
- Utilities reference: https://astro-gravatar.and.guide/reference/utilities/
- API endpoints: https://astro-gravatar.and.guide/reference/api-endpoints/
- Cloudflare Pages ops: `docs/cloudflare-pages.md`

## Cloudflare Pages deployment

The docs site is prepared for Cloudflare Pages Direct Upload with Wrangler. This keeps the build in Bun and lets you deploy from your local machine or GitHub Actions with a Cloudflare API token.

1. Copy `.env.pages.example` into your local environment or CI secrets/variables.
2. Run `bun run pages:check` to build the docs and verify Wrangler is ready.
3. Run `bun run pages:deploy` for production or `bun run pages:deploy:preview` for a preview branch deploy.
4. If you want a GitHub-driven deploy later, use `.github/workflows/deploy-docs-pages.yml` with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets plus a `CLOUDFLARE_PAGES_PROJECT_NAME` repo variable.

Because Direct Upload ships prebuilt assets, `PUBLIC_GA_MEASUREMENT_ID` must be present in the environment that runs the build when you want analytics enabled.

## Release workflow

This repo uses Bun for local validation, Sampo changesets for release intent, and a single GitHub Actions workflow that creates release PRs and publishes after those PRs are merged.

1. Run `bun run release:check`.
2. Add a Sampo release entry when the published package changes: `bun run sampo:add`.
3. Run `bun run sampo:preview` if you want to inspect the planned version bump before changing files.
4. Merge the feature PR into `main` once checks pass.
5. `.github/workflows/release.yml` will create or refresh a release PR from the pending `.sampo/changesets/*.md` entries.
6. Review and merge that release PR. The same workflow then publishes to npm with OIDC, creates tags, and opens GitHub Releases automatically.

### Workflow responsibilities

- `.github/workflows/release.yml` is the single release automation workflow.
- It runs Sampo in `auto` mode on `main`, `beta`, and `alpha`, which means it prepares release PRs when changesets exist and publishes after those PRs are merged.
- `packages/astro-gravatar/package.json` intentionally declares `packageManager: "npm@11.5.1"` so Sampo uses `npm publish` for npm Trusted Publishing, while local repo workflows still use Bun.
- npm Trusted Publishing for `astro-gravatar` must point at `.github/workflows/release.yml`.
- `.github/workflows/sampo-bot.yml` leaves a PR reminder when publishable package source changes without a `.sampo/changesets/*.md` entry. Add `skip-changeset`, `no-changeset`, or `release:skip` when a release entry is intentionally unnecessary.
- `bun run sampo:release` remains available as a manual escape hatch, but it is no longer the normal path for routine releases.

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
