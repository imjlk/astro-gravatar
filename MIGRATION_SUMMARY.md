# Migration Complete

The release workflow has been successfully migrated to use Sampo.

## Deliverables

### 1. Sampo Integration
- **Initialized**: `.sampo/` directory created with `config.toml`.
- **Configured**:
  - Main branch: `main`
  - Repository: `imjlk/astro-gravatar`
  - Unpublished packages ignored (including docs site).
  - Release branches: `beta`, `alpha`.
- **Scripts**: Added `changeset`, `changeset:pre`, `release:prepare` to `package.json`.

### 2. Workflow Automation
- **Workflow File**: `.github/workflows/release.yml` fully rewritten.
- **Triggers**:
  - Merged PRs to `main` (Release PR model).
  - Pushes to `beta` / `alpha` (Pre-releases).
- **Steps**:
  - Standard test gates maintained.
  - `sampo release` prepares versions/changelogs.
  - `npm publish` used with provenance (workaround for Bun limitations).
  - Git tagging and GitHub Release creation automated.

### 3. Documentation
- **README.md** updated with:
  - New "Creating Changesets" guide.
  - Explanation of Release PR workflow.
  - Bot installation instructions.

## Next Steps for You

1. **Install GitHub App**: Go to [https://github.com/apps/sampo](https://github.com/apps/sampo) and install the bot on this repository.
2. **First Release**:
   - Run `bun run changeset` to create a changeset for this migration.
   - Commit and push.
   - Merge the PR.
   - Sampo will create a "Release PR".
   - Merge the Release PR to trigger the first automated release.
