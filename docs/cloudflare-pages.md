# Cloudflare Pages deployment

Operational notes for `astro-gravatar.and.guide`.

## Deployment mode

The docs site is prepared for **Cloudflare Pages Direct Upload** with Wrangler.

- Build output directory: `apps/astro-gravatar.and.guide/dist`
- Local preflight: `bun run pages:check`
- Production deploy: `bun run pages:deploy`
- Preview deploy: `bun run pages:deploy:preview`
- Local Pages-style preview: `bun run pages:dev`

This repo keeps the build in Bun and uploads prebuilt assets with `wrangler pages deploy`. That makes local deploys and token-based CI deploys behave the same way.

If you choose Direct Upload for the Pages project, Cloudflare notes that you cannot later convert that same project into a Git-integrated Pages project. Create a separate project if you ever want Git integration instead.

## Required environment variables

For local or CI deploys, set:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

Optional variables:

- `CLOUDFLARE_PAGES_BRANCH`
  - Used by `bun run pages:deploy:preview`
  - When omitted, the deploy script falls back to the current git branch name and then to `preview`
- `PUBLIC_GA_MEASUREMENT_ID`
  - Optional
  - When omitted, analytics stays fully disabled and the consent banner is not rendered
  - When present during the build, the site ships the consent-first Google Analytics integration

An example file lives at `.env.pages.example`.

## GitHub Actions setup

The repo includes a manual workflow at `.github/workflows/deploy-docs-pages.yml`.
`release.yml` also reuses that workflow automatically after a successful publish.

Configure these values before using it:

- GitHub Actions secrets:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
- GitHub Actions variables:
  - `CLOUDFLARE_PAGES_PROJECT_NAME`
  - `PUBLIC_GA_MEASUREMENT_ID` if analytics should be enabled in deployed builds

Trigger the workflow with `target=production` or `target=preview`. Preview runs can also accept a custom `preview_branch`.
When `release.yml` publishes a new package version, it will call the same workflow automatically:

- `main` releases deploy the docs site to Pages production
- `beta` and `alpha` releases deploy a Pages preview tied to the release branch

## Local deployment checklist

1. Run `bun install`.
2. Export the variables from `.env.pages.example` or place them in `.env.local`.
3. Run `bun run pages:check`.
4. Run `bun run pages:deploy` for production or `bun run pages:deploy:preview` for a preview deployment.

Because Direct Upload sends a prebuilt `dist/` folder, build-time variables such as `PUBLIC_GA_MEASUREMENT_ID` must be present in the local shell or CI environment that runs the build. Setting them only inside the Cloudflare dashboard will not affect a direct upload build.

## Domain and previews

- Primary custom domain: `astro-gravatar.and.guide`
- Use Pages preview deployments for branch and PR verification before promoting changes to production
- Treat the Pages preview URL as the default smoke-test target for metadata, consent, and navigation checks

## Build/runtime baseline

- Node.js: `24`
- Bun: `latest`
- Install command: `bun install --frozen-lockfile`
- Build command for local or CI deploys: `bun run docs:build`

The repo is Bun-first and expects `bun.lock` to be respected during install/build.

## Rollback

If a production deploy regresses:

1. Re-run the deploy workflow from a known good commit or check out that commit locally
2. Rebuild and redeploy the docs with `bun run pages:deploy`
3. Confirm the recovered deployment at the custom domain and a fresh preview URL
