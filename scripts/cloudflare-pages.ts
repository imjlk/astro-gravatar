#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dir, '..');
const docsDir = resolve(rootDir, 'apps/astro-gravatar.and.guide');
const distDir = resolve(docsDir, 'dist');
const mode = Bun.argv[2] ?? 'check';

function env(name: string) {
  return process.env[name]?.trim();
}

function decode(bytes: Uint8Array<ArrayBufferLike>) {
  return new TextDecoder().decode(bytes).trim();
}

function currentBranch() {
  const result = Bun.spawnSync(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: rootDir,
    stdout: 'pipe',
    stderr: 'ignore',
  });

  if (result.exitCode !== 0) {
    return undefined;
  }

  const branch = decode(result.stdout);
  return branch && branch !== 'HEAD' ? branch : undefined;
}

async function run(command: string[], cwd = rootDir) {
  console.log(`$ ${command.join(' ')}`);

  const process = Bun.spawn(command, {
    cwd,
    env: Bun.env,
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  const exitCode = await process.exited;

  if (exitCode !== 0) {
    throw new Error(`Command failed with exit code ${exitCode}: ${command.join(' ')}`);
  }
}

async function buildDocs() {
  console.log('\nBuilding the docs site for Cloudflare Pages...');
  await run(['bun', 'run', 'docs:build']);
}

function assertDist() {
  if (!existsSync(distDir)) {
    throw new Error(`Expected built docs output at ${distDir}. Run \`bun run docs:build\` first.`);
  }
}

function requireEnv(names: string[]) {
  const missing = names.filter((name) => !env(name));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See .env.pages.example.`
    );
  }
}

async function check() {
  await buildDocs();
  assertDist();

  console.log('\nChecking Wrangler...');
  await run(['bunx', 'wrangler', '--version']);

  const missingDeployEnv = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_PAGES_PROJECT_NAME',
  ].filter((name) => !env(name));

  if (missingDeployEnv.length === 0) {
    console.log('\nChecking Cloudflare authentication...');
    await run(['bunx', 'wrangler', 'whoami']);
  } else {
    console.log(
      `\nSkipping Cloudflare auth check. Set ${missingDeployEnv.join(', ')} to validate deploy access.`
    );
  }

  console.log(`\nCloudflare Pages preflight passed. Built assets are ready at ${distDir}.`);
}

async function deploy(preview: boolean) {
  requireEnv(['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_PAGES_PROJECT_NAME']);

  await buildDocs();
  assertDist();

  const projectName = env('CLOUDFLARE_PAGES_PROJECT_NAME')!;
  const command = ['bunx', 'wrangler', 'pages', 'deploy', distDir, '--project-name', projectName];

  if (preview) {
    const branch = env('CLOUDFLARE_PAGES_BRANCH') ?? currentBranch() ?? 'preview';
    command.push('--branch', branch);
    console.log(`\nDeploying a preview build for branch "${branch}"...`);
  } else {
    console.log('\nDeploying the production build to Cloudflare Pages...');
  }

  await run(command);
}

async function dev() {
  await buildDocs();
  assertDist();

  const port = env('CLOUDFLARE_PAGES_DEV_PORT') ?? '8788';

  console.log(`\nStarting a local Cloudflare Pages preview on http://127.0.0.1:${port} ...`);
  await run(['bunx', 'wrangler', 'pages', 'dev', distDir, '--ip', '127.0.0.1', '--port', port]);
}

async function main() {
  switch (mode) {
    case 'check':
      await check();
      break;
    case 'deploy':
      await deploy(false);
      break;
    case 'deploy-preview':
      await deploy(true);
      break;
    case 'dev':
      await dev();
      break;
    default:
      throw new Error(`Unknown mode "${mode}". Use check, dev, deploy, or deploy-preview.`);
  }
}

main().catch((error) => {
  console.error(
    `\nCloudflare Pages command failed: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
});
