// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Astro Gravatar',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/your-username/astro-gravatar',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: '' },
            { label: 'Installation', slug: 'guides/installation' },
            { label: 'Quick Start', slug: 'guides/quick-start' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Basic Usage', slug: 'guides/basic-usage' },
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
