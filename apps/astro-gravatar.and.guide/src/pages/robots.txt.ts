import type { APIRoute } from 'astro';

const fallbackSite = new URL('https://astro-gravatar.and.guide');

export const GET: APIRoute = ({ site }) => {
  const base = site ?? fallbackSite;
  const sitemapUrl = new URL('/sitemap.xml', base).href;

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
