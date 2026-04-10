#!/usr/bin/env bun

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type WatchConfig = {
  repo: {
    owner: string;
    name: string;
  };
  docs: Array<{
    label: string;
    url: string;
  }>;
  reviewTargets: string[];
  issue: {
    title: string;
    label: string;
  };
};

type RepoInfo = {
  full_name: string;
  html_url: string;
  default_branch: string;
  pushed_at: string;
};

type CommitInfo = {
  sha: string;
  html_url: string;
  commit: {
    author: {
      date: string;
    };
    message: string;
  };
};

type ReleaseInfo = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
} | null;

type DocSnapshot = {
  label: string;
  url: string;
  status: number;
  ok: boolean;
  lastModified: string | null;
  lastUpdated: string | null;
  contentHash: string | null;
  error: string | null;
};

type UpstreamReport = {
  checkedAt: string;
  fingerprint: string;
  issue: WatchConfig['issue'];
  repo: RepoInfo;
  latestCommit: {
    sha: string;
    shortSha: string;
    url: string;
    date: string;
    message: string;
  };
  latestRelease: ReleaseInfo;
  docs: DocSnapshot[];
  reviewTargets: string[];
  markdown: string;
};

const rootDir = resolve(import.meta.dir, '..');
const configPath = resolve(rootDir, '.github/upstream/gravatar-watch.json');

function getArg(name: string) {
  const flag = `--${name}`;
  const index = Bun.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return Bun.argv[index + 1];
}

function getGithubHeaders() {
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'astro-gravatar-upstream-watch',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function hashText(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchJson<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getGithubHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

function extractLastUpdated(html: string) {
  const match = html.match(/Last updated on:\s*<\/p>\s*<p[^>]*>\s*([^<]+)\s*</i);
  return match?.[1]?.trim() ?? null;
}

async function fetchDocSnapshot(doc: WatchConfig['docs'][number]): Promise<DocSnapshot> {
  try {
    const response = await fetch(doc.url, {
      headers: {
        'User-Agent': 'astro-gravatar-upstream-watch',
      },
      redirect: 'follow',
    });

    const html = await response.text();

    return {
      label: doc.label,
      url: doc.url,
      status: response.status,
      ok: response.ok,
      lastModified: response.headers.get('last-modified'),
      lastUpdated: extractLastUpdated(html),
      contentHash: response.ok ? await hashText(html) : null,
      error: response.ok ? null : `Unexpected status ${response.status}`,
    };
  } catch (error) {
    return {
      label: doc.label,
      url: doc.url,
      status: 0,
      ok: false,
      lastModified: null,
      lastUpdated: null,
      contentHash: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function renderMarkdown(report: Omit<UpstreamReport, 'markdown'>) {
  const releaseLine = report.latestRelease
    ? `- Latest release: [\`${report.latestRelease.tag_name}\`](${report.latestRelease.html_url})${report.latestRelease.published_at ? ` published ${report.latestRelease.published_at}` : ''}`
    : '- Latest release: none published from the monorepo releases endpoint';

  const docsTableRows = report.docs
    .map(
      (doc) =>
        `| ${doc.label} | ${doc.ok ? 'OK' : 'Unavailable'} | ${doc.lastUpdated ?? 'n/a'} | ${doc.lastModified ?? 'n/a'} | ${doc.contentHash ? `\`${doc.contentHash.slice(0, 12)}\`` : 'n/a'} |`
    )
    .join('\n');

  const reviewTargets = report.reviewTargets
    .map((target) => `- [ ] Review \`${target}\``)
    .join('\n');

  return `## Upstream snapshot

- Checked at: ${report.checkedAt}
- Upstream repo: [\`${report.repo.full_name}\`](${report.repo.html_url})
- Default branch head: [\`${report.latestCommit.shortSha}\`](${report.latestCommit.url}) from ${report.latestCommit.date}
- Latest commit message: ${report.latestCommit.message}
${releaseLine}

## Monitored docs

| Source | Status | Last updated | Last-Modified header | Digest |
| --- | --- | --- | --- | --- |
${docsTableRows}

## Why this issue exists

This issue is managed by the upstream watcher workflow. When the upstream fingerprint changes, the issue body is updated and a comment is added so we can review whether \`astro-gravatar\` needs code, type, or docs follow-up.

## Review checklist

${reviewTargets}

## Suggested follow-up

- Confirm whether avatar, profile, or QR URL rules changed
- Confirm whether profile payload fields changed
- Update docs pages if official Gravatar docs changed
- Add or update tests before patching runtime behavior
`;
}

async function main() {
  const outputPath = getArg('out');
  const config = (await Bun.file(configPath).json()) as WatchConfig;

  const repoInfo = await fetchJson<RepoInfo>(
    `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}`
  );

  const latestCommit = await fetchJson<CommitInfo>(
    `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/commits/${repoInfo.default_branch}`
  );

  const releases = await fetchJson<ReleaseInfo[]>(
    `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/releases?per_page=1`
  );

  const docs = await Promise.all(config.docs.map((doc) => fetchDocSnapshot(doc)));
  const checkedAt = new Date().toISOString();
  const latestRelease = releases[0]
    ? {
        tag_name: releases[0].tag_name,
        name: releases[0].name,
        html_url: releases[0].html_url,
        published_at: releases[0].published_at,
        draft: releases[0].draft,
        prerelease: releases[0].prerelease,
      }
    : null;

  const fingerprintPayload = {
    repo: {
      fullName: repoInfo.full_name,
      defaultBranch: repoInfo.default_branch,
      pushedAt: repoInfo.pushed_at,
      latestCommitSha: latestCommit.sha,
      latestCommitDate: latestCommit.commit.author.date,
      latestReleaseTag: latestRelease?.tag_name ?? null,
      latestReleasePublishedAt: latestRelease?.published_at ?? null,
    },
    docs: docs.map((doc) => ({
      label: doc.label,
      url: doc.url,
      ok: doc.ok,
      lastUpdated: doc.lastUpdated,
      lastModified: doc.lastModified,
      contentHash: doc.contentHash,
    })),
  };

  const fingerprint = await hashText(JSON.stringify(fingerprintPayload));

  const report: UpstreamReport = {
    checkedAt,
    fingerprint,
    issue: config.issue,
    repo: {
      full_name: repoInfo.full_name,
      html_url: repoInfo.html_url,
      default_branch: repoInfo.default_branch,
      pushed_at: repoInfo.pushed_at,
    },
    latestCommit: {
      sha: latestCommit.sha,
      shortSha: latestCommit.sha.slice(0, 7),
      url: latestCommit.html_url,
      date: latestCommit.commit.author.date,
      message: latestCommit.commit.message.split('\n')[0] ?? '',
    },
    latestRelease,
    docs,
    reviewTargets: config.reviewTargets,
    markdown: '',
  };

  report.markdown = renderMarkdown(report);

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    await Bun.write(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Wrote upstream report to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(
    `Upstream watcher failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
  process.exit(1);
});
