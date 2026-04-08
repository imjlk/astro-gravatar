# astro-gravatar.and.guide

Documentation site for [`astro-gravatar`](https://www.npmjs.com/package/astro-gravatar), built with Astro and Starlight.

## Commands

- `bun run dev` starts the docs site locally
- `bun run build` builds the static site
- `bun run preview` previews the production build
- `bun run docs:build` from the repo root builds the docs site for CI or Cloudflare Pages
- `bun run pages:check` from the repo root validates the Pages-ready build and Wrangler tooling
- `bun run pages:deploy` from the repo root performs a direct upload deploy to Cloudflare Pages

From the monorepo root, the most common command is:

```bash
bun run dev
```

## Content layout

- `src/content/docs/guides` contains getting-started and workflow docs
- `src/content/docs/reference` contains API and component reference material
- `src/assets` contains images used by the docs site
- `public` contains static assets such as the favicon and hero image

## Links

- Docs: https://astro-gravatar.and.guide
- Package: https://www.npmjs.com/package/astro-gravatar
- Repo: https://github.com/imjlk/astro-gravatar
- Cloudflare Pages ops: ../../docs/cloudflare-pages.md
