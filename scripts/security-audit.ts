#!/usr/bin/env bun

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type IgnoredAdvisory = {
  id: string;
  reason: string;
};

const ignoredAdvisories: IgnoredAdvisory[] = [
  {
    id: 'GHSA-c2c7-rcm5-vvqj',
    reason:
      'Unpatched picomatch 2.x advisory pulled through Astro -> unstorage -> anymatch; Bun does not support nested overrides, so remove once that chain no longer resolves picomatch 2.3.1.',
  },
];

const args = [
  'audit',
  '--audit-level',
  'high',
  ...ignoredAdvisories.flatMap((advisory) => ['--ignore', advisory.id]),
];
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

console.log(`$ bun ${args.join(' ')}`);

if (ignoredAdvisories.length > 0) {
  console.log('\nIgnoring currently unpatched transitive advisories:');
  for (const advisory of ignoredAdvisories) {
    console.log(`- ${advisory.id}: ${advisory.reason}`);
  }
  console.log();
}

const audit = Bun.spawn(['bun', ...args], {
  cwd: repositoryRoot,
  env: Bun.env,
  stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(await audit.exited);
