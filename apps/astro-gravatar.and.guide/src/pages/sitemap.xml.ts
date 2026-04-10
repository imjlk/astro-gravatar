import type { APIRoute } from 'astro';

const fallbackSite = new URL('https://astro-gravatar.and.guide');

const docModules = import.meta.glob('../content/docs/**/*.{md,mdx}');

function filePathToRoute(filePath: string) {
  const relativePath = filePath
    .replace('../content/docs/', '')
    .replace(/\/?index\.(md|mdx)$/, '')
    .replace(/\.(md|mdx)$/, '');

  if (!relativePath || relativePath === 'index') {
    return '/';
  }

  if (relativePath === '404') {
    return null;
  }

  return `/${relativePath}/`;
}

function buildSitemapXml(urls: string[]) {
  const body = urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const GET: APIRoute = ({ site }) => {
  const base = site ?? fallbackSite;
  const urls = Object.keys(docModules)
    .map(filePathToRoute)
    .filter((route): route is string => Boolean(route))
    .sort((left, right) => left.localeCompare(right))
    .map((route) => new URL(route, base).href);

  return new Response(buildSitemapXml(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
