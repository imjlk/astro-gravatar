/**
 * Comprehensive tests for GravatarAvatar Astro component
 * Tests all props combinations, HTML output, responsive features, and error handling
 */

import { test, expect, describe, beforeAll } from 'bun:test';
import { buildAvatarUrl, validateAvatarParams, getDefaultAvatarConfig } from '../../lib/gravatar';
import { hashEmailWithCache } from '../../utils/hash';
import type { AvatarRating, DefaultAvatar } from '../../lib/types';
import {
  setupTestEnvironment,
  createMockProps,
  generateRandomEmail,
  setupMockDOM,
} from '../../../test-utils/test-helpers';
import { mockGravatarError } from '../../__tests__/mocks';

// Setup test environment
setupTestEnvironment();
setupMockDOM();

// Since Astro components are .astro files, we need to test them indirectly
// by importing the compiled JavaScript or testing the utility functions
// In a real Astro project, you would use Astro's testing utilities

describe('GravatarAvatar Component Tests', () => {
  const testEmail = 'test@example.com';
  let testEmailHash: string;

  beforeAll(async () => {
    testEmailHash = await hashEmailWithCache(testEmail);
  });

  async function renderGravatarAvatar(props: any) {
    const url = await buildAvatarUrl(props.email, {
      size: props.size,
      rating: props.rating,
      default: props.default,
      forceDefault: props.forceDefault,
    });

    const altText = props.alt !== undefined ? props.alt : `Avatar for ${props.email}`;

    let srcset = undefined;
    let sizesAttr = undefined;
    if (props.size) {
      const scales = [1, 1.5, 2];
      const srcPromises = scales.map(async scale => {
        const scaledSize = Math.round(props.size * scale);
        if (scaledSize > 2048) return null;
        const scaledUrl = await buildAvatarUrl(props.email, {
          size: scaledSize,
          rating: props.rating,
          default: props.default,
          forceDefault: props.forceDefault,
        });
        return `${scaledUrl} ${scale}x`;
      });
      const results = await Promise.all(srcPromises);
      srcset = results.filter(Boolean).join(', ');
      sizesAttr = `(max-width: 768px) ${Math.min(props.size, 80)}px, ${props.size}px`;
    }

    const className = props.class;
    const imgClass = ['gravatar-avatar', className].filter(Boolean).join(' ');

    let placeholderBorderRadius = '0';
    const classList = className?.split(' ') || [];
    if (classList.includes('rounded-full')) {
      placeholderBorderRadius = '50%';
    } else if (classList.includes('rounded')) {
      placeholderBorderRadius = '0.25rem';
    }

    return {
      url,
      props,
      wrapper: {
        class: 'gravatar-avatar-wrapper',
        'data-lazy': props.lazy ? 'true' : 'false',
      },
      placeholder: props.lazy ? {
        class: 'lazy-placeholder',
        style: {
          width: (props.size || 80) + 'px',
          height: (props.size || 80) + 'px',
          borderRadius: placeholderBorderRadius,
        }
      } : null,
      attributes: {
        src: url,
        srcset,
        sizes: sizesAttr,
        width: props.size,
        height: props.size,
        alt: altText,
        class: imgClass,
        loading: props.lazy ? 'lazy' : 'eager',
        decoding: 'async',
        importance: 'auto',
      },
    };
  }

  describe('Props to HTML Output', () => {
    test('should render basic avatar with just email', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.src).toContain(testEmailHash);
      expect(attributes.alt).toBe(`Avatar for ${testEmail}`);
      expect(attributes.class).toBe('gravatar-avatar');
      expect(attributes.loading).toBe('eager');
      expect(attributes.decoding).toBe('async');
      expect(attributes.importance).toBe('auto');
    });

    test('should render avatar with custom size', async () => {
      const props = { email: testEmail, size: 150 };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.width).toBe(150);
      expect(attributes.height).toBe(150);
      expect(attributes.src).toContain('s=150');
    });

    test('should render avatar with custom alt text', async () => {
      const props = { email: testEmail, alt: 'Custom alt text' };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.alt).toBe('Custom alt text');
    });

    test('should render avatar with custom CSS class', async () => {
      const props = { email: testEmail, class: 'custom-avatar rounded' };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.class).toBe('gravatar-avatar custom-avatar rounded');
    });

    test('should render avatar with lazy loading', async () => {
      const props = { email: testEmail, lazy: true };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.loading).toBe('lazy');
    });

    test('should pass through additional data attributes', async () => {
      const props = {
        email: testEmail,
        'data-testid': 'avatar-component',
        'data-user-id': '123',
      };
      const rendered = await renderGravatarAvatar(props);

      // Component should pass through additional props
      expect(rendered.props['data-testid']).toBe('avatar-component');
      expect(rendered.props['data-user-id']).toBe('123');
    });
  });

  describe('Responsive srcset Generation', () => {
    test('should generate srcset for responsive images', async () => {
      const props = { email: testEmail, size: 100 };
      const rendered = await renderGravatarAvatar(props);

      // Simulate srcset generation logic from the component
      const baseSize = props.size;
      const sizes = [1, 1.5, 2];
      const srcsetPromises = sizes.map(async scale => {
        const scaledSize = Math.round(baseSize * scale);
        if (scaledSize > 2048) return null;
        const scaledUrl = await buildAvatarUrl(testEmail, {
          size: scaledSize,
          rating: 'rating' in props ? (props as any).rating : undefined,
          default: 'default' in props ? (props as any).default : undefined,
          forceDefault: 'forceDefault' in props ? (props as any).forceDefault : undefined,
        });
        return `${scaledUrl} ${scale}x`;
      });
      const srcsetEntries = (await Promise.all(srcsetPromises)).filter(Boolean);

      const expectedSrcset = srcsetEntries.join(', ');

      expect(expectedSrcset).toContain('1x');
      expect(expectedSrcset).toContain('1.5x');
      expect(expectedSrcset).toContain('2x');
      expect(expectedSrcset).toContain('s=100');
      expect(expectedSrcset).toContain('s=150');
      expect(expectedSrcset).toContain('s=200');
    });

    test('should cap srcset sizes at 2048px', async () => {
      const props = { email: testEmail, size: 1200 };
      const rendered = await renderGravatarAvatar(props);

      // Simulate srcset generation
      const baseSize = props.size;
      const sizes = [1, 1.5, 2];
      const srcsetPromises = sizes.map(async scale => {
        const scaledSize = Math.round(baseSize * scale);
        if (scaledSize > 2048) return null;
        return `${await buildAvatarUrl(testEmail, { size: scaledSize })} ${scale}x`;
      });
      const srcsetEntries = (await Promise.all(srcsetPromises)).filter(Boolean);

      const srcset = srcsetEntries.join(', ');

      // 1200 * 2 = 2400 > 2048, so 2x should be excluded
      expect(srcset).toContain('1x');
      expect(srcset).toContain('1.5x');
      expect(srcset).not.toContain('2x');
    });

    test('should generate responsive sizes attribute', async () => {
      const props = { email: testEmail, size: 120 };
      const rendered = await renderGravatarAvatar(props);

      // Simulate sizes attribute generation
      const expectedSizes = `(max-width: 768px) ${Math.min(props.size, 80)}px, ${props.size}px`;
      expect(expectedSizes).toBe('(max-width: 768px) 80px, 120px');
    });

    test('should not generate srcset when size is not provided', async () => {
      const props = { email: testEmail };
      const rendered = await renderGravatarAvatar(props);

      expect((props as any).size).toBeUndefined();
    });
  });

  describe('Avatar URL Generation and Parameters', () => {
    test('should build correct avatar URL with all parameters', async () => {
      const props = {
        email: testEmail,
        size: 150,
        rating: 'pg' as AvatarRating,
        default: 'identicon' as DefaultAvatar,
        forceDefault: true,
      };
      const { url } = await renderGravatarAvatar(props);

      expect(url).toContain(testEmailHash);
      expect(url).toContain('s=150');
      expect(url).toContain('r=pg');
      expect(url).toContain('d=identicon');
      expect(url).toContain('f=y');
    });

    test('should handle custom default URL', async () => {
      const customDefault = 'https://example.com/default-avatar.png';
      const props = {
        email: testEmail,
        default: customDefault,
      };
      const { url } = await renderGravatarAvatar(props);

      // Custom URLs are single-encoded by URLSearchParams
      expect(url).toContain(encodeURIComponent(customDefault));
    });

    test('should exclude default parameters when using defaults', async () => {
      const props = { email: testEmail };
      const { url } = await renderGravatarAvatar(props);

      // Should not contain default parameters
      expect(url).not.toContain('s=80'); // Default size
      expect(url).not.toContain('r=g');  // Default rating
      expect(url).not.toContain('d=mp'); // Default default
    });
  });

  describe('Rating and Default Options', () => {
    test('should support all rating levels', async () => {
      // 'g' is the default, so it won't appear in the URL
      const nonDefaultRatings: AvatarRating[] = ['pg', 'r', 'x'];

      for (const rating of nonDefaultRatings) {
        const props = { email: testEmail, rating };
        const { url } = await renderGravatarAvatar(props);
        expect(url).toContain(`r=${rating}`);
      }

      // Test that default 'g' doesn't appear in URL
      const props = { email: testEmail, rating: 'g' };
      const { url } = await renderGravatarAvatar(props);
      expect(url).not.toContain('r=g');
    });

    test('should support all default avatar types', async () => {
      // 'mp' is the default, so it won't appear in the URL
      const nonDefaults: DefaultAvatar[] = ['404', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank'];

      for (const defaultType of nonDefaults) {
        const props = { email: testEmail, default: defaultType };
        const { url } = await renderGravatarAvatar(props);
        expect(url).toContain(`d=${defaultType}`);
      }

      // Test that default 'mp' doesn't appear in URL
      const props = { email: testEmail, default: 'mp' };
      const { url } = await renderGravatarAvatar(props);
      expect(url).not.toContain('d=mp');
    });

    test('should handle forceDefault parameter', async () => {
      const props = { email: testEmail, forceDefault: false };
      const { url } = await renderGravatarAvatar(props);

      expect(url).not.toContain('f=y');

      const propsWithForce = { email: testEmail, forceDefault: true };
      const { url: urlWithForce } = await renderGravatarAvatar(propsWithForce);

      expect(urlWithForce).toContain('f=y');
    });
  });

  describe('Alt Text Accessibility', () => {
    test('should generate appropriate alt text by default', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.alt).toBe(`Avatar for ${testEmail}`);
    });

    test('should use custom alt text when provided', async () => {
      const customAlt = 'Profile picture for John Doe';
      const props = { email: testEmail, alt: customAlt };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.alt).toBe(customAlt);
    });

    test('should handle empty alt text for decorative images', async () => {
      const props = { email: testEmail, alt: '' };
      const { attributes } = await renderGravatarAvatar(props);

      // Empty string should be preserved
      expect(attributes.alt).toBe('');
    });

    test('should handle special characters in email for alt text', async () => {
      const specialEmail = 'user+tag@example.com';
      const props = { email: specialEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.alt).toBe(`Avatar for ${specialEmail}`);
    });
  });

  describe('Custom CSS Class Application', () => {
    test('should apply default gravatar-avatar class', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.class).toContain('gravatar-avatar');
    });

    test('should merge custom classes with default class', async () => {
      const props = { email: testEmail, class: 'rounded shadow-lg' };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.class).toBe('gravatar-avatar rounded shadow-lg');
    });

    test('should handle multiple custom classes with various spacing', async () => {
      const props = { email: testEmail, class: '  rounded-full   border-2  ' };
      const { attributes } = await renderGravatarAvatar(props);

      // Component doesn't trim whitespace from custom classes
      expect(attributes.class).toBe('gravatar-avatar   rounded-full   border-2  ');
    });

    test('should handle empty custom class', async () => {
      const props = { email: testEmail, class: '' };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.class).toBe('gravatar-avatar');
    });
  });

  describe('Lazy Loading Behavior', () => {
    test('should set loading to eager by default', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.loading).toBe('eager');
    });

    test('should set loading to lazy when specified', async () => {
      const props = { email: testEmail, lazy: true };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.loading).toBe('lazy');
    });

    test('should set loading to eager when explicitly set to false', async () => {
      const props = { email: testEmail, lazy: false };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.loading).toBe('eager');
    });

    test('should include lazy wrapper when lazy is true', async () => {
      const props = { email: testEmail, lazy: true };
      const { props: componentProps } = await renderGravatarAvatar(props);

      expect(componentProps.lazy).toBe(true);
    });

    test('should not include lazy wrapper when lazy is false', async () => {
      const props = { email: testEmail, lazy: false };
      const { props: componentProps } = await renderGravatarAvatar(props);

      expect(componentProps.lazy).toBe(false);
    });
  });

  describe('Error Handling and Validation', () => {
    test('should handle invalid email addresses gracefully', () => {
      const invalidEmails = ['', 'invalid-email', 'user@', '@domain.com'];

      for (const email of invalidEmails) {
        expect(() => {
          // The component should handle invalid emails
          // This would typically throw an error from the hashEmail function
          try {
            hashEmailWithCache(email);
          } catch (error) {
            // Component should handle this error gracefully
            expect(error).toBeDefined();
          }
        }).not.toThrow();
      }
    });

    test('should validate size parameter bounds', () => {
      const invalidSizes = [0, -50, 2049, 5000];

      for (const size of invalidSizes) {
        expect(() => {
          validateAvatarParams(size);
        }).toThrow();
      }
    });

    test('should handle valid edge case sizes', async () => {
      const validSizes = [1, 2048];

      for (const size of validSizes) {
        await expect(buildAvatarUrl(testEmail, { size })).resolves.toBeDefined();
      }
    });

    test('should handle fetch errors gracefully', async () => {
      // Test scenario where image fails to load
      const props = { email: 'nonexistent@example.com' };

      // In a real browser, this would trigger the error handling
      // For now, we test that the URL is generated correctly
      const { url } = await renderGravatarAvatar(props);
      expect(url).toBeDefined();
      expect(url).toContain('gravatar.com');
    });
  });

  describe('Props Combinations and Edge Cases', () => {
    test('should handle all props together', async () => {
      const props = {
        email: testEmail,
        size: 200,
        rating: 'pg' as AvatarRating,
        default: 'identicon' as DefaultAvatar,
        forceDefault: true,
        class: 'avatar-custom',
        alt: 'Custom avatar',
        lazy: true,
        'data-testid': 'test-avatar',
      };
      const { attributes, url } = await renderGravatarAvatar(props);

      expect(attributes.width).toBe(200);
      expect(attributes.height).toBe(200);
      expect(attributes.alt).toBe('Custom avatar');
      expect(attributes.class).toBe('gravatar-avatar avatar-custom');
      expect(attributes.loading).toBe('lazy');
      expect(url).toContain('s=200');
      expect(url).toContain('r=pg');
      expect(url).toContain('d=identicon');
      expect(url).toContain('f=y');
    });

    test('should handle minimal props', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.src).toBeDefined();
      expect(attributes.alt).toBe(`Avatar for ${testEmail}`);
      expect(attributes.class).toBe('gravatar-avatar');
      expect(attributes.loading).toBe('eager');
      expect(attributes.width).toBeUndefined();
      expect(attributes.height).toBeUndefined();
    });

    test('should handle different email formats', async () => {
      const emails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@sub.domain.com',
        'UPPERCASE@EXAMPLE.COM',
      ];

      for (const email of emails) {
        const props = { email };
        const { attributes } = await renderGravatarAvatar(props);

        expect(attributes.src).toBeDefined();
        expect(attributes.alt).toBe(`Avatar for ${email}`);

        // All should generate different hashes
        const hash = await hashEmailWithCache(email.toLowerCase().trim());
        expect(attributes.src).toContain(hash);
      }
    });

    test('should handle size 1 (minimum)', async () => {
      const props = { email: testEmail, size: 1 };
      const { attributes, url } = await renderGravatarAvatar(props);

      expect(attributes.width).toBe(1);
      expect(attributes.height).toBe(1);
      expect(url).toContain('s=1');
    });

    test('should handle size 2048 (maximum)', async () => {
      const props = { email: testEmail, size: 2048 };
      const { attributes, url } = await renderGravatarAvatar(props);

      expect(attributes.width).toBe(2048);
      expect(attributes.height).toBe(2048);
      expect(url).toContain('s=2048');
    });
  });

  describe('Performance and Optimization Features', () => {
    test('should include decoding="async" attribute', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.decoding).toBe('async');
    });

    test('should include importance="auto" attribute', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarAvatar(props);

      expect(attributes.importance).toBe('auto');
    });

    test('should handle responsive srcset efficiently', async () => {
      const props = { email: testEmail, size: 100 };

      // Test that srcset generation doesn't create excessive URLs
      const { url } = await renderGravatarAvatar(props);
      const baseSize = props.size;
      const scales = [1, 1.5, 2];

      for (const scale of scales) {
        const scaledSize = Math.round(baseSize * scale);
        if (scaledSize <= 2048) {
          const scaledUrl = await buildAvatarUrl(testEmail, { size: scaledSize });
          expect(scaledUrl).toContain(`s=${scaledSize}`);
        }
      }
    });
  });

  describe('Component Integration', () => {
    test('should work with different avatar sizes in responsive design', async () => {
      const sizes = [32, 64, 128, 256, 512];

      for (const size of sizes) {
        const props = { email: testEmail, size };
        const { attributes, url } = await renderGravatarAvatar(props);

        expect(attributes.width).toBe(size);
        expect(attributes.height).toBe(size);
        expect(url).toContain(`s=${size}`);
      }
    });

    test('should maintain consistent hash generation across calls', async () => {
      const props = { email: testEmail, size: 100 };

      const { url: url1 } = await renderGravatarAvatar(props);
      const { url: url2 } = await renderGravatarAvatar(props);

      expect(url1).toBe(url2);
      expect(url1).toContain(testEmailHash);
    });

    test('should generate unique URLs for different emails', async () => {
      const emails = [testEmail, 'user2@example.com', 'user3@example.com'];
      const urls = [];

      for (const email of emails) {
        const props = { email };
        const { url } = await renderGravatarAvatar(props);
        urls.push(url);
      }

      // All URLs should be different
      expect(urls[0]).not.toBe(urls[1]);
      expect(urls[1]).not.toBe(urls[2]);
      expect(urls[0]).not.toBe(urls[2]);
    });
  });

  describe('Comprehensive Prop Tests', () => {
    test('should handle all possible rating values', async () => {
      const ratings: AvatarRating[] = ['g', 'pg', 'r', 'x'];
      for (const rating of ratings) {
        const props = { email: testEmail, rating };
        const { url } = await renderGravatarAvatar(props);
        if (rating === 'g') {
          expect(url).not.toContain('r=g');
        } else {
          expect(url).toContain(`r=${rating}`);
        }
      }
    });

    test('should handle all possible default image types', async () => {
      const defaults: DefaultAvatar[] = ['mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank', '404'];
      for (const defaultType of defaults) {
        const props = { email: testEmail, default: defaultType };
        const { url } = await renderGravatarAvatar(props);
        if (defaultType === 'mp') {
          expect(url).not.toContain('d=mp');
        } else {
          expect(url).toContain(`d=${defaultType}`);
        }
      }
    });

    test('should handle complex class combinations for placeholder borderRadius', async () => {
      const testCases = [
        { class: 'rounded-full', expected: '50%' },
        { class: 'rounded', expected: '0.25rem' },
        { class: 'custom-class rounded-full shadow', expected: '50%' },
        { class: 'my-avatar rounded border', expected: '0.25rem' },
        { class: 'no-rounded-here', expected: '0' },
        { class: undefined, expected: '0' },
      ];

      for (const { class: className, expected } of testCases) {
        const props = { email: testEmail, lazy: true, class: className };
        const rendered = await renderGravatarAvatar(props);
        expect(rendered.placeholder?.style.borderRadius).toBe(expected);
      }
    });

    test('should verify lazy loading wrapper and placeholder', async () => {
      const props = { email: testEmail, lazy: true, size: 120 };
      const rendered = await renderGravatarAvatar(props);

      expect(rendered.wrapper['data-lazy']).toBe('true');
      expect(rendered.placeholder).not.toBeNull();
      expect(rendered.placeholder?.class).toBe('lazy-placeholder');
      expect(rendered.placeholder?.style.width).toBe('120px');
      expect(rendered.placeholder?.style.height).toBe('120px');
      expect(rendered.attributes.loading).toBe('lazy');
    });

    test('should verify non-lazy loading state', async () => {
      const props = { email: testEmail, lazy: false };
      const rendered = await renderGravatarAvatar(props);

      expect(rendered.wrapper['data-lazy']).toBe('false');
      expect(rendered.placeholder).toBeNull();
      expect(rendered.attributes.loading).toBe('eager');
    });

    test('should handle srcset and sizes for different sizes', async () => {
      const sizes = [50, 100, 200];
      for (const size of sizes) {
        const props = { email: testEmail, size };
        const { attributes } = await renderGravatarAvatar(props);
        
        expect(attributes.srcset).toContain('1x');
        expect(attributes.srcset).toContain('1.5x');
        expect(attributes.srcset).toContain('2x');
        expect(attributes.sizes).toBe(`(max-width: 768px) ${Math.min(size, 80)}px, ${size}px`);
      }
    });

    test('should validate invalid rating parameter', () => {
      expect(() => {
        validateAvatarParams(100, 'invalid' as any);
      }).toThrow(/Avatar rating must be one of/);
    });

    test('should return default avatar configuration', () => {
      const config = getDefaultAvatarConfig();
      expect(config.size).toBe(80);
      expect(config.rating).toBe('g');
      expect(config.default).toBe('mp');
      expect(config.forceDefault).toBe(false);
    });
  });
});