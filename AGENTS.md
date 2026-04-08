---
description: Working conventions for the astro-gravatar Bun monorepo.
globs: "*"
alwaysApply: false
---

# astro-gravatar agent guide

## Stack and layout

- This repository is a Bun workspace monorepo. Prefer Bun for installs, scripts, tests, packaging, and ad-hoc execution.
- The publishable package lives in `packages/astro-gravatar`.
- The documentation site lives in `apps/astro-gravatar.and.guide` and uses Astro + Starlight.
- Root scripts orchestrate most common tasks. Start there unless you specifically need a package-local command.

## Command defaults

- Use `bun install` instead of npm, pnpm, or yarn.
- Use `bun run <script>` for workspace scripts.
- Use `bun test` or `bun run test:*` for tests.
- Use `bunx <tool>` for one-off CLIs.
- Prefer Bun-first solutions before adding new runtime or build tooling.

## Commands you will actually use in this repo

- Install dependencies: `bun install`
- Start docs locally: `bun run dev`
- Lint source: `bun run lint`
- Check formatting: `bun run format:check`
- Auto-format: `bun run format`
- Typecheck the package: `bun run typecheck`
- Run package tests: `bun run test`
- Run coverage enforcement: `bun run test:coverage`
- Build the package only: `bun run build:package`
- Build the docs site only: `bun run docs:build`
- Build package + docs together: `bun run build`
- Preview publish contents: `cd packages/astro-gravatar && bun pm pack --dry-run`
- Run full release checks: `bun run release:check`
- Preview the next Sampo release: `bun run sampo:preview`
- Build docs explicitly: `cd apps/astro-gravatar.and.guide && bun run build`

## Validation expectations

- If you change package runtime code, exports, components, utilities, or tests, run:
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test`
  - `bun run build:package`
- If you change coverage logic, CI scripts, or test infrastructure, run `bun run test:coverage`.
- If you change docs content, Astro config, or the Starlight app, run `cd apps/astro-gravatar.and.guide && bun run build`.
- If you change packaging, exports, release scripts, or publish-related files, also run `cd packages/astro-gravatar && bun pm pack --dry-run`.

## Codebase conventions

- Keep the public package surface in `packages/astro-gravatar/index.ts`. When adding public APIs, update exports there.
- The CLI entrypoint is `packages/astro-gravatar/src/cli/index.ts`. Keep it Bun-executable and cover CLI changes with tests in `packages/astro-gravatar/src/cli/__tests__`.
- Core Gravatar URL/API logic belongs in `packages/astro-gravatar/src/lib`.
- Hashing and email helpers belong in `packages/astro-gravatar/src/utils`.
- Shared constants belong in `packages/astro-gravatar/src/constants.ts`.
- Follow the existing ESM import style. This repo often uses `.js` import specifiers from TypeScript source for emitted compatibility; do not "fix" those casually.
- Add or update tests next to the relevant area:
  - component behavior: `packages/astro-gravatar/src/components/__tests__`
  - library logic: `packages/astro-gravatar/src/lib/__tests__`
  - shared infra/helpers: `packages/astro-gravatar/src/__tests__`

## Astro package submission expectations

- Treat `packages/astro-gravatar/package.json` as submission-critical metadata for npm and Astro ecosystem discovery.
- Keep Astro discovery keywords present: `astro-component` and `withastro`.
- Keep category keywords aligned with package purpose when relevant, such as `ui`, `image`, `images`, and `utility`.
- Maintain accurate `description`, `homepage`, `bugs`, and `repository` fields. Because this is a monorepo, keep `repository.directory` pointed at `packages/astro-gravatar`.
- Keep the published `files` list intentionally narrow. Do not publish tests, fixtures, coverage output, local notes, or other development-only files.
- Ensure the package tarball includes `README.md`, `CHANGELOG.md`, and `LICENSE`.
- If package exports or subpath imports change, verify they still read cleanly from npm package consumers and Astro projects.

## Generated and derived artifacts

- Do not hand-edit generated output in `packages/astro-gravatar/dist/`.
- Do not commit or manually edit transient coverage output in `packages/astro-gravatar/coverage/` unless the workflow explicitly requires it.
- Keep lockfile updates intentional. If dependencies change, prefer `bun install` so `bun.lock` stays consistent.
- Sampo release entries live in `.sampo/changesets/`. Do not reintroduce the old top-level `.changesets/` directory.

## CI and release notes

- CI currently checks lint, formatting, typechecking, coverage, build, security audit, pack dry-run, and bundle size.
- Coverage enforcement is implemented by `packages/astro-gravatar/package.json` plus `scripts/check-coverage.ts`.
- `release.yml` is the only release automation workflow. It performs release checks, publishes with npm Trusted Publishing (OIDC), and creates the version tag when npm is behind the committed package version.
- Changes that affect the published package should usually include a Sampo release entry via `bun run sampo:add`.
- `sampo-bot.yml` comments on PRs that touch publishable package source without adding a `.sampo/changesets/*.md` file. Use `skip-changeset`, `no-changeset`, or `release:skip` only when a release entry is intentionally unnecessary.
- npm Trusted Publishing must be configured for `.github/workflows/release.yml`.
- The operational release sequence is: `bun run release:check` -> `bun run sampo:add` -> optional `bun run sampo:preview` -> `bun run sampo:release` -> review version/changelog -> push the release-prepared commit to `main` -> let `release.yml` publish and create the `v<version>` tag.

## Documentation expectations

- User-facing docs live under `apps/astro-gravatar.and.guide/src/content/docs`.
- When you add or change components, props, utilities, error behavior, or CLI features, update the relevant docs and README content in the same change when practical.
