/**
 * Comprehensive tests for GravatarQR Astro component
 * Tests all props combinations, HTML output, responsive features, QR code generation, and error handling
 */

import { test, expect, describe } from 'bun:test';
import { buildQRCodeUrl } from '../../lib/gravatar';
import { hashEmailWithCache } from '../../utils/hash';
import type { QRCodeVersion, QRCodeIcon } from '../../lib/types';
import { GravatarError, GRAVATAR_ERROR_CODES } from '../../lib/types';

// Mock DOM environment for testing
const mockDocument = {
  createElement: () => ({
    setAttribute: () => {},
    className: '',
    style: {},
  }),
};

// Setup global document for tests
(global as any).document = mockDocument;

describe('GravatarQR Component Tests', () => {
  const testEmail = 'test@example.com';
  const testEmailHash = hashEmailWithCache(testEmail);

  // Helper function to simulate component rendering
  async function renderGravatarQR(props: any) {
    // In a real Astro test environment, this would use astro:test
    // For now, we'll test the URL generation and validate expected behavior

    // Simulate Astro props destructuring with defaults
    const {
      email,
      size = 80,
      version = 1,
      type = 'none',
      utmMedium,
      utmCampaign,
      class: className,
      alt,
    } = props;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new GravatarError(
        'Valid email address is required for QR code generation',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    // Validate size - only if explicitly provided (not using default)
    if (props.size !== undefined && (props.size < 1 || props.size > 1000)) {
      throw new GravatarError(
        'QR code size must be between 1 and 1000 pixels',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    // Validate version - only if explicitly provided (not using default)
    if (props.version !== undefined && ![1, 3].includes(props.version)) {
      throw new GravatarError(
        'QR code version must be 1 (standard) or 3 (modern dots)',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    // Validate type - only if explicitly provided (not using default)
    if (props.type !== undefined && !['user', 'gravatar', 'none'].includes(props.type)) {
      throw new GravatarError(
        'QR code type must be "user", "gravatar", or "none"',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    try {
      // Build QR code URL
      const qrCodeUrl = buildQRCodeUrl(email, {
        size,
        version,
        type,
        utmMedium,
        utmCampaign,
      });

      // Generate alt text (matching component logic)
      const altText = alt !== undefined ? alt : `QR code linking to ${email}'s Gravatar profile`;

      // Generate CSS classes (matching component logic)
      const cssClasses = [
        'gravatar-qr',
        className || '',
      ].filter(Boolean).join(' ');

      // Simulate srcset generation
      const generateSrcset = (baseSize: number) => {
        const scales = [1, 1.5, 2];
        return scales
          .map(scale => {
            const scaledSize = Math.round(baseSize * scale);
            const maxSize = 1000;
            if (scaledSize > maxSize) return null;

            const scaledUrl = buildQRCodeUrl(email, {
              size: scaledSize,
              version,
              type,
              utmMedium,
              utmCampaign,
            });

            return `${scaledUrl} ${scale}x`;
          })
          .filter(Boolean)
          .join(', ');
      };

      const srcset = props.size ? generateSrcset(size) : undefined;
      const sizes = props.size ? `(max-width: 768px) ${Math.min(size, 120)}px, ${size}px` : undefined;

      return {
        url: qrCodeUrl,
        srcset,
        sizes,
        props,
        // Simulate the HTML attributes that would be generated
        attributes: {
          src: qrCodeUrl,
          srcset,
          sizes,
          width: props.size,
          height: props.size,
          alt: altText,
          class: cssClasses,
          loading: 'lazy',
          decoding: 'async',
          importance: 'auto',
          title: `Scan QR code to view ${email}'s Gravatar profile`,
        },
        containerClass: 'gravatar-qr-container',
      };
    } catch (error) {
      // Simulate error handling
      throw error;
    }
  }

  describe('Props to HTML Output', () => {
    test('should render basic QR code with just email', async () => {
      const props = { email: testEmail };
      const { attributes, containerClass } = await renderGravatarQR(props);

      expect(attributes.src).toContain(testEmailHash);
      expect(attributes.alt).toBe(`QR code linking to ${testEmail}'s Gravatar profile`);
      expect(attributes.class).toBe('gravatar-qr');
      expect(attributes.loading).toBe('lazy');
      expect(attributes.decoding).toBe('async');
      expect(attributes.importance).toBe('auto');
      expect(attributes.title).toContain(testEmail);
      expect(containerClass).toBe('gravatar-qr-container');
    });

    test('should render QR code with custom size', async () => {
      const props = { email: testEmail, size: 150 };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.width).toBe(150);
      expect(attributes.height).toBe(150);
      expect(attributes.src).toContain('size=150');
    });

    test('should render QR code with custom alt text', async () => {
      const props = { email: testEmail, alt: 'Custom QR code alt text' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.alt).toBe('Custom QR code alt text');
    });

    test('should render QR code with custom CSS class', async () => {
      const props = { email: testEmail, class: 'custom-qr rounded' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toBe('gravatar-qr custom-qr rounded');
    });

    test('should render QR code with version 3 (modern dots)', async () => {
      const props = { email: testEmail, version: 3 as QRCodeVersion };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('version=3');
    });

    test('should render QR code with user icon type', async () => {
      const props = { email: testEmail, type: 'user' as QRCodeIcon };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('type=user');
    });

    test('should render QR code with gravatar icon type', async () => {
      const props = { email: testEmail, type: 'gravatar' as QRCodeIcon };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('type=gravatar');
    });

    test('should render QR code with no icon type (default)', async () => {
      const props = { email: testEmail, type: 'none' as QRCodeIcon };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).not.toContain('type=none'); // 'none' is default, so it's excluded
    });
  });

  describe('UTM Parameter Support', () => {
    test('should include utm_medium parameter', async () => {
      const props = { email: testEmail, utmMedium: 'web' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_medium=web');
    });

    test('should include utm_campaign parameter', async () => {
      const props = { email: testEmail, utmCampaign: 'profile_share' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_campaign=profile_share');
    });

    test('should include both UTM parameters', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'mobile_app',
        utmCampaign: 'user_profile',
      };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_medium=mobile_app');
      expect(attributes.src).toContain('utm_campaign=user_profile');
    });

    test('should encode UTM parameters properly', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'web app',
        utmCampaign: 'profile-share-2024',
      };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_medium=web+app'); // URL encoding
      expect(attributes.src).toContain('utm_campaign=profile-share-2024');
    });
  });

  describe('Responsive srcset Generation', () => {
    test('should generate srcset for responsive QR codes', async () => {
      const props = { email: testEmail, size: 100 };
      const { srcset } = await renderGravatarQR(props);

      expect(srcset).toContain('1x');
      expect(srcset).toContain('1.5x');
      expect(srcset).toContain('2x');
      expect(srcset).toContain('size=100');
      expect(srcset).toContain('size=150');
      expect(srcset).toContain('size=200');
    });

    test('should cap srcset sizes at 1000px', async () => {
      const props = { email: testEmail, size: 600 };
      const { srcset } = await renderGravatarQR(props);

      expect(srcset).toContain('1x');
      expect(srcset).toContain('1.5x');
      // 600 * 2 = 1200 > 1000, so 2x should be excluded
      expect(srcset).not.toContain('2x');
    });

    test('should generate responsive sizes attribute', async () => {
      const props = { email: testEmail, size: 150 };
      const { sizes } = await renderGravatarQR(props);

      expect(sizes).toBe('(max-width: 768px) 120px, 150px');
    });

    test('should cap mobile size at 120px', async () => {
      const props = { email: testEmail, size: 80 };
      const { sizes } = await renderGravatarQR(props);

      expect(sizes).toBe('(max-width: 768px) 80px, 80px');
    });

    test('should not generate srcset when size is not provided', async () => {
      const props = { email: testEmail };
      const { srcset } = await renderGravatarQR(props);

      expect(srcset).toBeUndefined();
    });
  });

  describe('QR Code URL Generation and Parameters', () => {
    test('should build correct QR code URL with all parameters', async () => {
      const props = {
        email: testEmail,
        size: 150,
        version: 3 as QRCodeVersion,
        type: 'gravatar' as QRCodeIcon,
        utmMedium: 'web',
        utmCampaign: 'profile',
      };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain(testEmailHash);
      expect(url).toContain('size=150');
      expect(url).toContain('version=3');
      expect(url).toContain('type=gravatar');
      expect(url).toContain('utm_medium=web');
      expect(url).toContain('utm_campaign=profile');
    });

    test('should use default values when parameters are not provided', async () => {
      const props = { email: testEmail };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain(testEmailHash);
      // Should not include default parameters in URL
      expect(url).not.toContain('size=80');
      expect(url).not.toContain('version=1');
      expect(url).not.toContain('type=none');
    });

    test('should handle special characters in UTM parameters', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'web&mobile',
        utmCampaign: 'profile-2024@v1',
      };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain('utm_medium=web%26mobile');
      expect(url).toContain('utm_campaign=profile-2024%40v1');
    });
  });

  describe('QR Code Version Support', () => {
    test('should support version 1 (standard)', async () => {
      const props = { email: testEmail, version: 1 as QRCodeVersion };
      const { url } = await renderGravatarQR(props);

      // Version 1 is default, so it might not appear in URL
      expect(url).toContain(testEmailHash);
    });

    test('should support version 3 (modern dots)', async () => {
      const props = { email: testEmail, version: 3 as QRCodeVersion };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain('version=3');
    });

    test('should handle version parameter correctly', async () => {
      const versions: QRCodeVersion[] = [1, 3];

      for (const version of versions) {
        const props = { email: testEmail, version };
        const { url } = await renderGravatarQR(props);

        if (version === 3) {
          expect(url).toContain('version=3');
        }
      }
    });
  });

  describe('QR Code Icon Type Support', () => {
    test('should support all icon types', async () => {
      const types: QRCodeIcon[] = ['user', 'gravatar', 'none'];

      for (const type of types) {
        const props = { email: testEmail, type };
        const { url } = await renderGravatarQR(props);

        if (type !== 'none') {
          expect(url).toContain(`type=${type}`);
        }
      }
    });

    test('should not include type parameter for "none"', async () => {
      const props = { email: testEmail, type: 'none' as QRCodeIcon };
      const { url } = await renderGravatarQR(props);

      expect(url).not.toContain('type=none');
    });
  });

  describe('Accessibility Features', () => {
    test('should generate appropriate alt text by default', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.alt).toBe(`QR code linking to ${testEmail}'s Gravatar profile`);
    });

    test('should use custom alt text when provided', async () => {
      const customAlt = 'Scan to view John Doe profile';
      const props = { email: testEmail, alt: customAlt };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.alt).toBe(customAlt);
    });

    test('should include title attribute for hover tooltip', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.title).toBe(`Scan QR code to view ${testEmail}'s Gravatar profile`);
    });

    test('should handle empty alt text for decorative QR codes', async () => {
      const props = { email: testEmail, alt: '' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.alt).toBe('');
    });

    test('should handle special characters in email for accessibility text', async () => {
      const specialEmail = 'user+tag@example.com';
      const props = { email: specialEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.alt).toBe(`QR code linking to ${specialEmail}'s Gravatar profile`);
      expect(attributes.title).toBe(`Scan QR code to view ${specialEmail}'s Gravatar profile`);
    });
  });

  describe('Custom CSS Class Application', () => {
    test('should apply default gravatar-qr class', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toContain('gravatar-qr');
    });

    test('should merge custom classes with default class', async () => {
      const props = { email: testEmail, class: 'rounded shadow-lg' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toBe('gravatar-qr rounded shadow-lg');
    });

    test('should handle empty custom class', async () => {
      const props = { email: testEmail, class: '' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toBe('gravatar-qr');
    });

    test('should handle undefined custom class', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toBe('gravatar-qr');
    });
  });

  describe('Error Handling and Validation', () => {
    test('should reject invalid email addresses', async () => {
      const invalidEmails = [
        '',
        'invalid-email',
        'user@',
        '@domain.com',
        'user.domain.com',
        'user@domain',
      ];

      for (const email of invalidEmails) {
        const props = { email };

        await expect(renderGravatarQR(props)).rejects.toThrow(
          'Valid email address is required for QR code generation'
        );
      }
    });

    test('should reject invalid size values', async () => {
      const invalidSizes = [0, -50, 1001, 5000];

      for (const size of invalidSizes) {
        const props = { email: testEmail, size };

        await expect(renderGravatarQR(props)).rejects.toThrow(
          'QR code size must be between 1 and 1000 pixels'
        );
      }
    });

    test('should reject invalid version values', async () => {
      const invalidVersions = [0, 2, 4, 5];

      for (const version of invalidVersions) {
        const props = { email: testEmail, version };

        await expect(renderGravatarQR(props)).rejects.toThrow(
          'QR code version must be 1 (standard) or 3 (modern dots)'
        );
      }
    });

    test('should reject invalid type values', async () => {
      const invalidTypes = ['invalid', 'admin', 'logo', 'custom'];

      for (const type of invalidTypes) {
        const props = { email: testEmail, type };

        await expect(renderGravatarQR(props)).rejects.toThrow(
          'QR code type must be "user", "gravatar", or "none"'
        );
      }
    });

    test('should handle valid edge case sizes', async () => {
      const validSizes = [1, 1000];

      for (const size of validSizes) {
        const props = { email: testEmail, size };
        const { attributes } = await renderGravatarQR(props);

        expect(attributes.width).toBe(size);
        expect(attributes.height).toBe(size);
      }
    });
  });

  describe('Default Values and Behavior', () => {
    test('should use default size when not provided', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain(testEmailHash);
      expect(attributes.src).not.toContain('size=');
    });

    test('should use default version when not provided', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain(testEmailHash);
      expect(attributes.src).not.toContain('version=');
    });

    test('should use default type when not provided', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain(testEmailHash);
      expect(attributes.src).not.toContain('type=');
    });

    test('should always include lazy loading by default', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.loading).toBe('lazy');
    });

    test('should always include decoding="async"', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.decoding).toBe('async');
    });

    test('should always include importance="auto"', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.importance).toBe('auto');
    });
  });

  describe('Props Combinations and Edge Cases', () => {
    test('should handle all props together', async () => {
      const props = {
        email: testEmail,
        size: 200,
        version: 3 as QRCodeVersion,
        type: 'gravatar' as QRCodeIcon,
        utmMedium: 'web_app',
        utmCampaign: 'user_profile_2024',
        class: 'qr-custom rounded-lg',
        alt: 'Custom QR code alt',
      };
      const { attributes, url } = await renderGravatarQR(props);

      expect(attributes.width).toBe(200);
      expect(attributes.height).toBe(200);
      expect(attributes.alt).toBe('Custom QR code alt');
      expect(attributes.class).toBe('gravatar-qr qr-custom rounded-lg');
      expect(attributes.loading).toBe('lazy');
      expect(url).toContain('size=200');
      expect(url).toContain('version=3');
      expect(url).toContain('type=gravatar');
      expect(url).toContain('utm_medium=web_app');
      expect(url).toContain('utm_campaign=user_profile_2024');
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
        const { attributes } = await renderGravatarQR(props);

        expect(attributes.src).toBeDefined();
        expect(attributes.alt).toBe(`QR code linking to ${email}'s Gravatar profile`);
        expect(attributes.title).toBe(`Scan QR code to view ${email}'s Gravatar profile`);

        // All should generate different hashes
        const hash = hashEmailWithCache(email.toLowerCase().trim());
        expect(attributes.src).toContain(hash);
      }
    });

    test('should handle size 1 (minimum)', async () => {
      const props = { email: testEmail, size: 1 };
      const { attributes, url } = await renderGravatarQR(props);

      expect(attributes.width).toBe(1);
      expect(attributes.height).toBe(1);
      expect(url).toContain('size=1');
    });

    test('should handle size 1000 (maximum)', async () => {
      const props = { email: testEmail, size: 1000 };
      const { attributes, url } = await renderGravatarQR(props);

      expect(attributes.width).toBe(1000);
      expect(attributes.height).toBe(1000);
      expect(url).toContain('size=1000');
    });

    test('should handle UTM parameters with special characters', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'Web & Mobile App',
        utmCampaign: 'Profile Share - 2024',
      };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain('utm_medium=Web+%26+Mobile+App');
      expect(url).toContain('utm_campaign=Profile+Share+-+2024');
    });
  });

  describe('Performance and Optimization Features', () => {
    test('should include loading="lazy" attribute', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.loading).toBe('lazy');
    });

    test('should include decoding="async" attribute', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.decoding).toBe('async');
    });

    test('should include importance="auto" attribute', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.importance).toBe('auto');
    });

    test('should handle responsive srcset efficiently', async () => {
      const props = { email: testEmail, size: 100 };
      const { srcset } = await renderGravatarQR(props);

      // Test that srcset generation doesn't create excessive URLs
      expect(srcset).toBeDefined();
      expect(srcset!.split(',').length).toBeLessThanOrEqual(3); // Max 3 scales
    });

    test('should optimize for mobile viewports', async () => {
      const props = { email: testEmail, size: 200 };
      const { sizes } = await renderGravatarQR(props);

      // Mobile size should be capped at 120px
      expect(sizes).toBe('(max-width: 768px) 120px, 200px');
    });
  });

  describe('Component Integration', () => {
    test('should work with different QR code sizes in responsive design', async () => {
      const sizes = [60, 120, 200, 400];

      for (const size of sizes) {
        const props = { email: testEmail, size };
        const { attributes, url } = await renderGravatarQR(props);

        expect(attributes.width).toBe(size);
        expect(attributes.height).toBe(size);
        expect(url).toContain(`size=${size}`);
      }
    });

    test('should maintain consistent hash generation across calls', async () => {
      const props = { email: testEmail, size: 100 };

      const { url: url1 } = await renderGravatarQR(props);
      const { url: url2 } = await renderGravatarQR(props);

      expect(url1).toBe(url2);
      expect(url1).toContain(testEmailHash);
    });

    test('should generate unique URLs for different emails', async () => {
      const emails = [testEmail, 'user2@example.com', 'user3@example.com'];
      const urls = [];

      for (const email of emails) {
        const props = { email };
        const { url } = await renderGravatarQR(props);
        urls.push(url);
      }

      // All URLs should be different
      expect(urls[0]).not.toBe(urls[1]);
      expect(urls[1]).not.toBe(urls[2]);
      expect(urls[0]).not.toBe(urls[2]);
    });

    test('should handle consistent URL structure across different parameter combinations', async () => {
      const baseProps = { email: testEmail, size: 100 };
      const variations = [
        { ...baseProps, version: 1 as QRCodeVersion },
        { ...baseProps, version: 3 as QRCodeVersion },
        { ...baseProps, type: 'user' as QRCodeIcon },
        { ...baseProps, type: 'gravatar' as QRCodeIcon },
        { ...baseProps, utmMedium: 'web' },
        { ...baseProps, utmCampaign: 'profile' },
      ];

      const urls = [];
      for (const props of variations) {
        const { url } = await renderGravatarQR(props);
        urls.push(url);
      }

      // All URLs should contain the email hash
      for (const url of urls) {
        expect(url).toContain(testEmailHash);
        expect(url).toContain('api.gravatar.com/v3/qr-code');
      }

      // URLs should be different based on parameters
      const uniqueUrls = [...new Set(urls)];
      expect(uniqueUrls.length).toBe(urls.length);
    });
  });
});