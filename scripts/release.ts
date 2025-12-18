#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const packagePath = join(process.cwd(), "packages", "astro-gravatar", "package.json");

interface ReleaseOptions {
  type?: "patch" | "minor" | "major" | "prerelease" | "preminor" | "beta" | "alpha";
  preid?: string;
  tag?: string;
  dryRun?: boolean;
  skipTests?: boolean;
  skipGit?: boolean;
}

async function getCurrentVersion(): Promise<string> {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  return packageJson.version;
}

async function bumpVersion(options: ReleaseOptions): Promise<string> {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const currentVersion = packageJson.version;

  console.log(`Current version: ${currentVersion}`);

  let versionCmd = `pm version ${options.type}`;

  if (options.preid) {
    versionCmd += ` --preid=${options.preid}`;
  }

  if (options.skipGit) {
    versionCmd += " --no-git-tag-version";
  }

  console.log(`Running: bun ${versionCmd}`);

  const env = { BUN_CONFIG_NO_JSON_WARNINGS: "1" };
  const versionArgs = ["pm", "version", options.type];
  if (options.preid) versionArgs.push(`--preid=${options.preid}`);
  if (options.skipGit) versionArgs.push("--no-git-tag-version");

  const result = await $`cd packages/astro-gravatar && bun ${versionArgs}`.env(env).catch((err) => {
    console.error("Version bump failed:", err.stderr?.toString());
    throw new Error("Version bump failed");
  });

  const newPackageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const newVersion = newPackageJson.version;

  console.log(`New version: ${newVersion}`);
  return newVersion;
}

async function createGitTag(version: string, skipGit: boolean = false): Promise<void> {
  if (skipGit) {
    console.log("Skipping git operations");
    return;
  }

  console.log(`Creating git tag for version ${version}...`);

  await $`git add packages/astro-gravatar/package.json`.catch((err) => {
    console.warn("Git add failed (possibly no changes):", err.stderr?.toString());
  });

  const gitStatus = await $`git status --porcelain packages/astro-gravatar/package.json`.text();

  if (gitStatus.trim()) {
    await $`git commit -m "chore(release): bump version to ${version}"`;
  }

  await $`git tag -a "v${version}" -m "Release v${version}"`;
  await $`git push origin main --follow-tags`;
}

async function publishPackage(tag: string = "latest", dryRun: boolean = false): Promise<void> {
  if (dryRun) {
    console.log("Dry run: Would publish to npm with tag:", tag);
    return;
  }

  console.log(`Publishing to npm with tag: ${tag}`);

  await $`cd packages/astro-gravatar && bun publish${tag === "latest" ? "" : ` --tag ${tag}`}`;
}

async function generateChangelog(version: string): Promise<string> {
  try {
    const result = await $`git describe --tags --abbrev=0 HEAD^`.quiet().catch(() => "");
    const prevTag = (typeof result === 'string' ? result : result.stdout?.toString())?.trim() || "";

    let changelogCmd = `git log --pretty=format:"- %s (%h)"`;
    if (prevTag) {
      changelogCmd += ` ${prevTag}..HEAD`;
    }

    const changelogResult = await $`${changelogCmd}`;
    return (typeof changelogResult === 'string' ? changelogResult : changelogResult.stdout?.toString())?.trim() || "Release changes";
  } catch (error) {
    console.warn("Could not generate changelog:", error);
    return "Release changes";
  }
}

async function updateChangelog(version: string, changes: string): Promise<void> {
  const changelogPath = join(process.cwd(), "CHANGELOG.md");
  let existingChangelog = "";

  try {
    existingChangelog = readFileSync(changelogPath, "utf8");
  } catch {
    // File doesn't exist, will create it
  }

  const today = new Date().toISOString().split('T')[0];
  const newEntry = `## [${version}] - ${today}\n\n${changes}\n\n`;

  if (existingChangelog) {
    const updatedChangelog = `# Changelog\n\n${newEntry}${existingChangelog}`;
    writeFileSync(changelogPath, updatedChangelog);
  } else {
    writeFileSync(changelogPath, `# Changelog\n\n${newEntry}`);
  }

  console.log("Updated CHANGELOG.md");
}

async function runPreReleaseChecks(): Promise<void> {
  console.log("Running pre-release checks...");

  console.log("Running tests...");
  const testResult = await $`bun run test`.catch((err) => {
    console.error("Tests failed:", err.stderr?.toString());
    throw new Error("Tests failed");
  });

  if (testResult.exitCode !== 0) {
    throw new Error("Tests failed");
  }

  console.log("Running type checking...");
  const typecheckResult = await $`bun run typecheck`.catch((err) => {
    console.error("Type checking failed:", err.stderr?.toString());
    throw new Error("Type checking failed");
  });

  if (typecheckResult.exitCode !== 0) {
    throw new Error("Type checking failed");
  }

  console.log("Building package...");
  const buildResult = await $`bun run build`.catch((err) => {
    console.error("Build failed:", err.stderr?.toString());
    throw new Error("Build failed");
  });

  if (buildResult.exitCode !== 0) {
    throw new Error("Build failed");
  }
}

function parseArgs(args: string[]): ReleaseOptions {
  const options: ReleaseOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "patch":
      case "minor":
      case "major":
      case "prerelease":
        options.type = arg;
        break;

      case "beta":
        options.type = "preminor";
        options.preid = "beta";
        options.tag = "beta";
        break;

      case "alpha":
        options.type = "preminor";
        options.preid = "alpha";
        options.tag = "alpha";
        break;

      case "--dry-run":
        options.dryRun = true;
        break;

      case "--skip-tests":
        options.skipTests = true;
        break;

      case "--skip-git":
        options.skipGit = true;
        break;

      case "--preid":
        if (i + 1 < args.length) {
          options.preid = args[++i];
        }
        break;

      case "--tag":
        if (i + 1 < args.length) {
          options.tag = args[++i];
        }
        break;

      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        } else {
          console.error(`Unknown command: ${arg}`);
          process.exit(1);
        }
    }
  }

  // Default to patch if no type specified
  if (!options.type) {
    options.type = "patch";
  }

  return options;
}

function printHelp(): void {
  console.log(`
Bun-based Release Automation for astro-gravatar

Usage: bun run release [command] [options]

Commands:
  patch       (default) Create a patch release (1.0.0 → 1.0.1)
  minor       Create a minor release (1.0.0 → 1.1.0)
  major       Create a major release (1.0.0 → 2.0.0)
  prerelease  Create a prerelease (1.0.0 → 1.0.1-0)
  beta        Create a beta release (1.0.0 → 1.1.0-beta.0)
  alpha       Create an alpha release (1.0.0 → 1.1.0-alpha.0)

Options:
  --dry-run      Simulate release without publishing
  --skip-tests   Skip running tests
  --skip-git     Skip git operations (commit/tag/push)
  --preid <id>   Pre-release identifier (beta, alpha, rc)
  --tag <tag>    Publish with specific npm tag

Examples:
  bun run release patch                    # Patch release with full process
  bun run release minor --dry-run            # Dry run for minor release
  bun run release beta                        # Beta release
  bun run release alpha --skip-tests          # Alpha release without tests
  bun run release major --skip-git            # Major release without git ops

Environment Variables:
  GITHUB_TOKEN  GitHub token for repository operations
  NPM_TOKEN      npm token for publishing (if not configured)
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  try {
    const options = parseArgs(args);

    console.log(`Starting ${options.type} release process...`);
    console.log(`Options:`, options);

    // Pre-release checks
    if (!options.skipTests) {
      await runPreReleaseChecks();
    }

    // Bump version
    const version = await bumpVersion(options);

    // Create git tag and push
    if (!options.dryRun) {
      await createGitTag(version, options.skipGit);

      // Generate and update changelog
      const changes = await generateChangelog(version);
      await updateChangelog(version, changes);
    }

    // Publish package
    const publishTag = options.tag || "latest";
    await publishPackage(publishTag, options.dryRun);

    console.log(`\n✅ ${options.type} release v${version} completed successfully!`);

    if (!options.dryRun) {
      console.log(`📦 Published to npm with tag: ${publishTag}`);
      console.log(`🏷️  Git tag created: v${version}`);
      console.log(`📝 CHANGELOG.md updated`);
      console.log(`\n🚀 Release available at: https://www.npmjs.com/package/astro-gravatar`);
    } else {
      console.log(`\n🔍 Dry run completed - no actual changes made`);
    }

  } catch (error) {
    console.error(`\n❌ Release failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);