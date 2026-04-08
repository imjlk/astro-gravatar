# Cloudflare Pages deployment

Operational notes for `astro-gravatar.and.guide`.

## Project configuration

- Platform: Cloudflare Pages
- Production branch: `main`
- Build command: `bun run build`
- Build output directory: `apps/astro-gravatar.and.guide/dist`
- Root directory: repository root

## Build environment

Pin the build image to modern runtime versions:

- `NODE_VERSION=24`
- `BUN_VERSION=latest`

The repo is Bun-first and expects `bun.lock` to be respected during install/build.

## Environment variables

Set these in Pages under **Settings -> Environment variables**:

- `PUBLIC_GA_MEASUREMENT_ID`
  - Optional
  - When omitted, analytics stays fully disabled and the consent banner is not rendered
  - When present, the site shows a consent-first analytics banner before loading Google Analytics

Keep the variable aligned between Production and Preview if you want consent behavior to match both environments.

## Domain and previews

- Primary custom domain: `astro-gravatar.and.guide`
- Use Pages preview deployments for branch and PR verification before promoting changes to production
- Treat the Pages preview URL as the default smoke-test target for metadata, consent, and navigation checks

## Rollback

If a production deploy regresses:

1. Open the Cloudflare Pages project and locate the last known good deployment
2. Retry or promote that deployment if available
3. If a code rollback is needed, revert the offending commit on `main`
4. Confirm the recovered deployment at the custom domain and a fresh preview URL
