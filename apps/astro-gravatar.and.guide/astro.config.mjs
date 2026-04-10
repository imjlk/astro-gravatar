// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://astro-gravatar.and.guide',
  integrations: [
    starlight({
      title: 'Astro Gravatar',
      description:
        'Astro-native Gravatar avatars, profile cards, and QR codes for production sites.',
      titleDelimiter: '·',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/site.css'],
      components: {
        Hero: './src/components/starlight/Hero.astro',
        Footer: './src/components/starlight/Footer.astro',
        PageFrame: './src/components/starlight/PageFrame.astro',
      },
      disable404Route: true,
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#0f1729' },
        },
        {
          tag: 'meta',
          attrs: { name: 'robots', content: 'index,follow' },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://astro-gravatar.and.guide/og-card.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content:
              'Astro Gravatar landing page preview with avatars, a profile card, and a QR code.',
          },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://astro-gravatar.and.guide/og-card.png',
          },
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/imjlk/astro-gravatar',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'guides/installation' },
            { label: 'Quick Start', slug: 'guides/quick-start' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Basic Usage', slug: 'guides/basic-usage' },
            { label: 'CLI', slug: 'guides/cli' },
            { label: 'Authentication', slug: 'guides/authentication' },
            { label: 'Error Handling', slug: 'guides/error-handling' },
            { label: 'Performance', slug: 'guides/performance' },
            { label: 'Advanced Examples', slug: 'guides/advanced-examples' },
            { label: 'Troubleshooting', slug: 'guides/troubleshooting' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Components', slug: 'reference/components' },
            { label: 'GravatarQR', slug: 'reference/gravatar-qr' },
            { label: 'Utilities', slug: 'reference/utilities' },
            { label: 'API Endpoints', slug: 'reference/api-endpoints' },
          ],
        },
      ],
    }),
  ],
});
