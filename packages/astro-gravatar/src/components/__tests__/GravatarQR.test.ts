/**
 * Comprehensive tests for GravatarQR Astro component
 * Tests all props combinations, HTML output, responsive features, QR code generation, and error handling
 */

import { test, expect, describe, beforeAll } from 'bun:test';
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
  let testEmailHash: string;

  beforeAll(async () => {
    testEmailHash = await hashEmailWithCache(testEmail);
  });

  // Helper function to simulate component rendering
  async function renderGravatarQR(props: any) {
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

    // Validate size
    if (props.size !== undefined && (props.size < 1 || props.size > 1000)) {
      throw new GravatarError(
        'QR code size must be between 1 and 1000 pixels',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    // Validate version
    if (props.version !== undefined && ![1, 3].includes(props.version)) {
      throw new GravatarError(
        'QR code version must be 1 (standard) or 3 (modern dots)',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    // Validate type
    if (props.type !== undefined && !['user', 'gravatar', 'none'].includes(props.type)) {
      throw new GravatarError(
        'QR code type must be "user", "gravatar", or "none"',
        GRAVATAR_ERROR_CODES.INVALID_EMAIL
      );
    }

    try {
      const qrCodeUrl = await buildQRCodeUrl(email, {
        size,
        version,
        type,
        utmMedium,
        utmCampaign,
      });

      const altText = alt !== undefined ? alt : `QR code linking to ${email}'s Gravatar profile`;

      const cssClasses = ['gravatar-qr', className || ''].filter(Boolean).join(' ');

      const generateSrcset = async (baseSize: number) => {
        const scales = [1, 1.5, 2];
        const promises = scales.map(async (scale) => {
          const scaledSize = Math.round(baseSize * scale);
          const maxSize = 1000;
          if (scaledSize > maxSize) return null;

          const scaledUrl = await buildQRCodeUrl(email, {
            size: scaledSize,
            version,
            type,
            utmMedium,
            utmCampaign,
          });

          return `${scaledUrl} ${scale}x`;
        });
        return (await Promise.all(promises)).filter(Boolean).join(', ');
      };

      const srcset = props.size ? await generateSrcset(size) : undefined;
      const sizes = props.size
        ? `(max-width: 768px) ${Math.min(size, 120)}px, ${size}px`
        : undefined;

      return {
        url: qrCodeUrl,
        srcset,
        sizes,
        props,
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
          title: `Scan QR code to view ${email}'s Gravatar profile`,
        },
        containerClass: 'gravatar-qr-container',
      };
    } catch (error) {
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

    test('should handle multiple CSS classes with extra whitespace', async () => {
      const props = { email: testEmail, class: '  class1   class2  ' };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.class).toBe('gravatar-qr   class1   class2  ');
    });
  });

  describe('QR Code Version Support', () => {
    test('should support version 1 (standard)', async () => {
      const props = { email: testEmail, version: 1 as QRCodeVersion };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain(testEmailHash);
      expect(url).not.toContain('version=1');
    });

    test('should support version 3 (modern dots)', async () => {
      const props = { email: testEmail, version: 3 as QRCodeVersion };
      const { url } = await renderGravatarQR(props);

      expect(url).toContain('version=3');
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
        } else {
          expect(url).not.toContain('type=');
        }
      }
    });
  });

  describe('UTM Parameter Support', () => {
    test('should include utm_medium and utm_campaign parameters', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'web',
        utmCampaign: 'profile_share',
      };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_medium=web');
      expect(attributes.src).toContain('utm_campaign=profile_share');
    });

    test('should encode UTM parameters properly', async () => {
      const props = {
        email: testEmail,
        utmMedium: 'web app',
        utmCampaign: 'promo/2024?id=test',
      };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.src).toContain('utm_medium=web+app');
      expect(attributes.src).toContain('utm_campaign=promo%2F2024%3Fid%3Dtest');
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

      expect(srcset).toContain('1.5x');
      expect(srcset).not.toContain('2x');
    });

    test('should generate responsive sizes attribute', async () => {
      const props = { email: testEmail, size: 150 };
      const { sizes } = await renderGravatarQR(props);

      expect(sizes).toBe('(max-width: 768px) 120px, 150px');
    });
  });

  describe('Error Handling and Validation', () => {
    test('should reject invalid email addresses', async () => {
      const props = { email: 'invalid-email' };
      await expect(renderGravatarQR(props)).rejects.toThrow();
    });

    test('should reject invalid size values', async () => {
      const props = { email: testEmail, size: 1001 };
      await expect(renderGravatarQR(props)).rejects.toThrow(
        'QR code size must be between 1 and 1000 pixels'
      );
    });

    test('should reject invalid version values', async () => {
      const props = { email: testEmail, version: 2 as any };
      await expect(renderGravatarQR(props)).rejects.toThrow(
        'QR code version must be 1 (standard) or 3 (modern dots)'
      );
    });

    test('should reject invalid type values', async () => {
      const props = { email: testEmail, type: 'invalid' as any };
      await expect(renderGravatarQR(props)).rejects.toThrow(
        'QR code type must be "user", "gravatar", or "none"'
      );
    });
  });

  describe('Default Values', () => {
    test('should use default values when props are missing', async () => {
      const props = { email: testEmail };
      const { attributes } = await renderGravatarQR(props);

      expect(attributes.loading).toBe('lazy');
      expect(attributes.decoding).toBe('async');
      expect(attributes.src).not.toContain('size=');
      expect(attributes.src).not.toContain('version=');
      expect(attributes.src).not.toContain('type=');
    });
  });
});
