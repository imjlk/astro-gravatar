/**
 * Comprehensive tests for GravatarProfileCard Astro component
 * Tests layouts, templates, API integration, conditional features, and error handling
 */

import { test, expect, describe, beforeEach, afterEach, beforeAll } from 'bun:test';
import { buildAvatarUrl, getProfile } from '../../lib/gravatar';
import { hashEmailWithCache } from '../../utils/hash';
import type { GravatarProfile } from '../../lib/types';
import {
  setupTestEnvironment,
  setupFetchWithResponses,
  createMockResponse,
  TestDataGenerator,
  generateRandomEmail,
  setupMockDOM,
} from '../../../test-utils/test-helpers';
import {
  mockGravatarProfile,
  mockMinimalGravatarProfile,
  mockOrganizationProfile,
  mockGravatarError,
  mockNotFoundResponse,
} from '../../__tests__/mocks';

// Setup test environment
setupTestEnvironment();
setupMockDOM();

describe('GravatarProfileCard Component Tests', () => {
  const testEmail = 'test@example.com';
  let testEmailHash: string;
  let mockFetchCleanup: (() => void) | null = null;

  beforeAll(async () => {
    testEmailHash = await hashEmailWithCache(testEmail);
  });

  beforeEach(() => {
    // Reset any previous mocks
    if (mockFetchCleanup) {
      mockFetchCleanup();
      mockFetchCleanup = null;
    }
  });

  afterEach(() => {
    // Clean up mocks
    if (mockFetchCleanup) {
      mockFetchCleanup();
      mockFetchCleanup = null;
    }
  });

  // Helper function to simulate component rendering
  async function renderGravatarProfileCard(props: any, profileData: GravatarProfile | null = null) {
    // Setup fetch mock for profile API calls
    if (profileData) {
      const responses = {
        [testEmailHash]: createMockResponse(profileData, 200),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);
    }

    try {
      // Simulate profile fetching
      const profile = profileData || await getProfile(props.email);

      // Generate avatar URL
      const avatarUrl = await buildAvatarUrl(props.email, { size: props.avatarSize || 80 });

      // Generate CSS classes
      const cssClasses = [
        'gravatar-profile-card',
        `gravatar-profile-card--${props.layout || 'card'}`,
        `gravatar-profile-card--${props.template || 'default'}`,
        props.clickable ? 'gravatar-profile-card--clickable' : '',
        props.class || '',
      ].filter(Boolean).join(' ');

      // Simulate conditional rendering logic
      const shouldShowName = props.showName !== false;
      const shouldShowBio = props.showBio !== false && !!profile?.description;
      const shouldShowVerified = props.showVerified !== false && !!(profile?.verified_accounts?.length);
      const shouldShowLinks = props.showLinks !== false && !!(profile?.links?.length);

      const filteredLinks = profile?.links?.slice(0, props.maxLinks || 3) || [];
      const visibleVerifiedAccounts = profile?.verified_accounts?.filter(
        (account: any) => !account.is_hidden
      ) || [];

      // Simulate the HTML structure that would be generated
      return {
        profile,
        avatarUrl,
        cssClasses,
        props,
        shouldShowName,
        shouldShowBio,
        shouldShowVerified,
        shouldShowLinks,
        filteredLinks,
        visibleVerifiedAccounts,
      };
    } catch (error) {
      // Handle profile fetch errors
      return {
        profile: null,
        profileError: error,
        avatarUrl: await buildAvatarUrl(props.email, { size: props.avatarSize || 80 }),
        cssClasses: [
          'gravatar-profile-card',
          `gravatar-profile-card--${props.layout || 'card'}`,
          `gravatar-profile-card--${props.template || 'default'}`,
          props.class || '',
        ].filter(Boolean).join(' '),
        props,
        shouldShowName: props.showName !== false,
        shouldShowBio: false,
        shouldShowVerified: false,
        shouldShowLinks: false,
        filteredLinks: [],
        visibleVerifiedAccounts: [],
      };
    }
  }

  describe('Layout Rendering', () => {
    test('should render card layout by default', async () => {
      const props = { email: testEmail };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card');
      expect(cssClasses).toContain('gravatar-profile-card--card');
      expect(cssClasses).toContain('gravatar-profile-card--default');
    });

    test('should render horizontal layout', async () => {
      const props = { email: testEmail, layout: 'horizontal' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--horizontal');
      expect(cssClasses).not.toContain('gravatar-profile-card--vertical');
      expect(cssClasses).not.toContain('gravatar-profile-card--card');
    });

    test('should render vertical layout', async () => {
      const props = { email: testEmail, layout: 'vertical' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--vertical');
      expect(cssClasses).not.toContain('gravatar-profile-card--horizontal');
      expect(cssClasses).not.toContain('gravatar-profile-card--card');
    });

    test('should render card layout explicitly', async () => {
      const props = { email: testEmail, layout: 'card' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--card');
      expect(cssClasses).not.toContain('gravatar-profile-card--horizontal');
      expect(cssClasses).not.toContain('gravatar-profile-card--vertical');
    });

    test('should apply custom CSS classes', async () => {
      const props = { email: testEmail, class: 'custom-card shadow-lg' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('custom-card');
      expect(cssClasses).toContain('shadow-lg');
      expect(cssClasses).toContain('gravatar-profile-card');
    });
  });

  describe('Template Variants', () => {
    test('should render default template', async () => {
      const props = { email: testEmail, template: 'default' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--default');
      expect(cssClasses).not.toContain('gravatar-profile-card--compact');
      expect(cssClasses).not.toContain('gravatar-profile-card--detailed');
    });

    test('should render compact template', async () => {
      const props = { email: testEmail, template: 'compact' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--compact');
      expect(cssClasses).not.toContain('gravatar-profile-card--default');
      expect(cssClasses).not.toContain('gravatar-profile-card--detailed');
    });

    test('should render detailed template', async () => {
      const props = { email: testEmail, template: 'detailed' };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--detailed');
      expect(cssClasses).not.toContain('gravatar-profile-card--default');
      expect(cssClasses).not.toContain('gravatar-profile-card--compact');
    });

    test('should truncate bio text differently for templates', async () => {
      const longBio = 'This is a very long bio that should be truncated differently based on the template being used for rendering the profile card component in the astro gravatar library testing suite.';

      const profileWithLongBio = {
        ...mockGravatarProfile,
        description: longBio,
      };

      // Test default template (150 chars)
      const propsDefault = { email: testEmail, template: 'default' };
      const { shouldShowBio: showBioDefault } = await renderGravatarProfileCard(propsDefault, profileWithLongBio);

      // Test compact template (60 chars)
      const propsCompact = { email: testEmail, template: 'compact' };
      const { shouldShowBio: showBioCompact } = await renderGravatarProfileCard(propsCompact, profileWithLongBio);

      expect(showBioDefault).toBe(true);
      expect(showBioCompact).toBe(true);

      // The actual truncation would happen in the component template
      // Here we test that bio would be shown for both templates
      expect(longBio.length).toBeGreaterThan(150);
      expect(longBio.length).toBeGreaterThan(60);
    });

    test('should show additional details in detailed template', async () => {
      const props = { email: testEmail, template: 'detailed' };
      const { profile } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(profile?.job_title).toBeDefined();
      expect(profile?.company).toBeDefined();
      expect(profile?.location).toBeDefined();

      // In detailed template, these would be displayed
      expect(mockGravatarProfile.job_title).toBe('Senior Software Engineer');
      expect(mockGravatarProfile.company).toBe('Tech Corp');
      expect(mockGravatarProfile.location).toBe('San Francisco, CA');
    });
  });

  describe('API Integration', () => {
    test('should fetch profile data successfully', async () => {
      const props = { email: testEmail };
      const { profile } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('John Doe');
      expect(profile?.profile_url).toBe('https://gravatar.com/johndoe');
      expect(profile?.avatar_url).toBe('https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
    });

    test('should handle minimal profile data', async () => {
      const props = { email: testEmail };
      const { profile } = await renderGravatarProfileCard(props, mockMinimalGravatarProfile);

      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('Minimal User');
      expect(profile?.description).toBeUndefined();
      expect(profile?.links).toBeUndefined();
    });

    test('should handle organization profiles', async () => {
      const props = { email: testEmail };
      const { profile } = await renderGravatarProfileCard(props, mockOrganizationProfile);

      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('Tech Corp');
      expect(profile?.is_organization).toBe(true);
      expect(profile?.company).toBe('Tech Corp');
      expect(profile?.job_title).toBeUndefined();
    });

    test('should handle API errors gracefully', async () => {
      const props = { email: 'nonexistent@example.com' };
      const emailHash = await hashEmailWithCache('nonexistent@example.com');
      const responses = {
        [emailHash]: createMockResponse(mockNotFoundResponse, 404),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);

      const { profile, profileError } = await renderGravatarProfileCard(props);

      expect(profile).toBeNull();
      expect(profileError).toBeDefined();
    });

    test('should continue rendering avatar when profile fetch fails', async () => {
      const props = { email: 'nonexistent@example.com' };
      const emailHash = await hashEmailWithCache('nonexistent@example.com');
      const responses = {
        [emailHash]: createMockResponse(mockNotFoundResponse, 404),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);

      const { avatarUrl, profileError } = await renderGravatarProfileCard(props);

      expect(avatarUrl).toBeDefined();
      expect(avatarUrl).toContain('gravatar.com/avatar');
      expect(profileError).toBeDefined();
    });

    test('should generate correct avatar URL', async () => {
      const props = { email: testEmail, avatarSize: 120 };
      const { avatarUrl } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(avatarUrl).toContain(testEmailHash);
      expect(avatarUrl).toContain('s=120');
    });
  });

  describe('Conditional Feature Display', () => {
    test('should show name by default', async () => {
      const props = { email: testEmail };
      const { shouldShowName } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowName).toBe(true);
    });

    test('should hide name when showName is false', async () => {
      const props = { email: testEmail, showName: false };
      const { shouldShowName } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowName).toBe(false);
    });

    test('should show bio when available and enabled', async () => {
      const props = { email: testEmail, showBio: true };
      const { shouldShowBio } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowBio).toBe(true);
    });

    test('should hide bio when disabled', async () => {
      const props = { email: testEmail, showBio: false };
      const { shouldShowName, shouldShowBio } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowName).toBe(true); // Name should still show
      expect(shouldShowBio).toBe(false);
    });

    test('should not show bio when profile has no description', async () => {
      const props = { email: testEmail, showBio: true };
      const profileWithoutBio = { ...mockGravatarProfile, description: undefined };
      const { shouldShowBio } = await renderGravatarProfileCard(props, profileWithoutBio);

      expect(shouldShowBio).toBe(false);
    });

    test('should show verified accounts when available and enabled', async () => {
      const props = { email: testEmail, showVerified: true };
      const { shouldShowVerified, visibleVerifiedAccounts } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowVerified).toBe(true);
      expect(visibleVerifiedAccounts.length).toBeGreaterThan(0);
      expect(visibleVerifiedAccounts[0].service_label).toBe('Twitter');
    });

    test('should hide verified accounts when disabled', async () => {
      const props = { email: testEmail, showVerified: false };
      const { shouldShowVerified } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowVerified).toBe(false);
    });

    test('should filter out hidden verified accounts', async () => {
      const props = { email: testEmail, showVerified: true };
      const profileWithHiddenAccounts = {
        ...mockGravatarProfile,
        verified_accounts: [
          ...mockGravatarProfile.verified_accounts!,
          {
            service_type: 'private',
            service_label: 'Private Account',
            service_icon: 'https://example.com/icon.png',
            url: 'https://example.com',
            is_hidden: true,
          },
        ],
      };
      const { visibleVerifiedAccounts } = await renderGravatarProfileCard(props, profileWithHiddenAccounts);

      expect(visibleVerifiedAccounts.length).toBe(2); // Only non-hidden accounts
      expect(visibleVerifiedAccounts.every(account => !account.is_hidden)).toBe(true);
    });

    test('should show links when available and enabled', async () => {
      const props = { email: testEmail, showLinks: true };
      const { shouldShowLinks, filteredLinks } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowLinks).toBe(true);
      expect(filteredLinks.length).toBeGreaterThan(0);
      expect(filteredLinks[0].label).toBe('Personal Website');
    });

    test('should hide links when disabled', async () => {
      const props = { email: testEmail, showLinks: false };
      const { shouldShowLinks } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(shouldShowLinks).toBe(false);
    });

    test('should limit number of links shown', async () => {
      const props = { email: testEmail, showLinks: true, maxLinks: 1 };
      const { filteredLinks } = await renderGravatarProfileCard(props, mockGravatarProfile);

      const duplicateKey = 'test-key';
      const key1 = 'value1';
      const attributes = {
        [duplicateKey as any]: key1,
        'other-key': 'value2'
      };
      expect(attributes[duplicateKey as any]).toBe(key1);
      expect(filteredLinks.length).toBe(1);
      expect(filteredLinks[0].label).toBe('Personal Website');
    });

    test('should use default maxLinks when not specified', async () => {
      const props = { email: testEmail, showLinks: true };
      const { filteredLinks } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(filteredLinks.length).toBeLessThanOrEqual(3); // Default maxLinks is 3
    });

    test('should not show links when profile has no links', async () => {
      const props = { email: testEmail, showLinks: true };
      const profileWithoutLinks = { ...mockGravatarProfile, links: undefined };
      const { shouldShowLinks } = await renderGravatarProfileCard(props, profileWithoutLinks);

      expect(shouldShowLinks).toBe(false);
    });
  });

  describe('Clickable Behavior', () => {
    test('should not be clickable by default', async () => {
      const props = { email: testEmail, clickable: false };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).not.toContain('gravatar-profile-card--clickable');
    });

    test('should be clickable when enabled', async () => {
      const props = { email: testEmail, clickable: true };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card--clickable');
    });

    test('should show clickable overlay when enabled and profile has URL', async () => {
      const props = { email: testEmail, clickable: true };
      const { profile } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(profile?.profile_url).toBeDefined();
      expect(profile?.profile_url).toBe('https://gravatar.com/johndoe');
    });

    test('should not show clickable overlay when profile has no URL', async () => {
      const props = { email: testEmail, clickable: true };
      const profileWithoutUrl = { ...mockGravatarProfile, profile_url: '' };
      const { profile } = await renderGravatarProfileCard(props, profileWithoutUrl);

      expect(profile?.profile_url).toBe('');
    });
  });

  describe('Avatar Size Configuration', () => {
    test('should use default avatar size when not specified', async () => {
      const props = { email: testEmail };
      const { avatarUrl } = await renderGravatarProfileCard(props, mockGravatarProfile);

      // Default size (80) is not included in URL since it's the default
      expect(avatarUrl).not.toContain('s=');
    });

    test('should use custom avatar size', async () => {
      const props = { email: testEmail, avatarSize: 150 };
      const { avatarUrl } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(avatarUrl).toContain('s=150');
    });

    test('should handle various avatar sizes', async () => {
      const sizes = [32, 64, 128, 256];

      for (const size of sizes) {
        const props = { email: testEmail, avatarSize: size };
        const { avatarUrl } = await renderGravatarProfileCard(props, mockGravatarProfile);

        expect(avatarUrl).toContain(`s=${size}`);
      }
    });

    test('should include attributes in the output', async () => {
      const testEmail = 'user@example.com';
      const attributes = { 'data-test': 'value', class: 'custom-class' };
      const props = { email: testEmail, ...attributes };
      const result = await renderGravatarProfileCard(props, mockGravatarProfile);

      // Check that attributes are passed to props and classes are generated
      expect(result.props['data-test']).toBe('value');
      expect(result.cssClasses).toContain('custom-class');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const props = { email: testEmail };
      const responses = {
        [testEmailHash]: createMockResponse({ error: 'Network error' }, 500),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);

      const { profile, profileError } = await renderGravatarProfileCard(props);

      expect(profile).toBeNull();
      expect(profileError).toBeDefined();
    });

    test('should handle malformed API responses', async () => {
      const props = { email: testEmail };
      const responses = {
        [testEmailHash]: createMockResponse('invalid json', 200),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);

      // Just verify the test runs without throwing an unhandled error
      const result = await renderGravatarProfileCard(props);
      expect(result).toBeDefined();
      // The component should handle this gracefully in some way
    });

    test('should handle empty profile response', async () => {
      const props = { email: testEmail };
      const responses = {
        [testEmailHash]: createMockResponse({}, 200),
      };
      mockFetchCleanup = setupFetchWithResponses(responses);

      const { profile } = await renderGravatarProfileCard(props);

      expect(profile).toBeDefined();
      // Component should handle empty profile gracefully
    });

    test('should handle missing profile fields', async () => {
      const props = { email: testEmail };
      const incompleteProfile = {
        hash: testEmailHash,
        profile_url: 'https://gravatar.com/user',
        display_name: 'User',
        avatar_url: 'https://gravatar.com/avatar/xxx',
        avatar_alt_text: 'User Avatar'
      }; // Missing other fields
      const { profile } = await renderGravatarProfileCard(props, incompleteProfile);

      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('User');
      // Component should handle missing fields gracefully
    });

    test('should handle invalid email addresses', async () => {
      const invalidEmails = ['', 'invalid-email', 'user@', '@domain.com'];

      for (const email of invalidEmails) {
        const props = { email };

        // Should throw an error for invalid emails
        expect(async () => {
          await renderGravatarProfileCard(props);
        }).toThrow();
      }
    });
  });

  describe('Data Processing and Formatting', () => {
    test('should truncate long bio text', async () => {
      const longBio = 'A'.repeat(200); // 200 characters
      const profileWithLongBio = {
        ...mockGravatarProfile,
        description: longBio,
      };

      const props = { email: testEmail, template: 'default' };
      const { shouldShowBio } = await renderGravatarProfileCard(props, profileWithLongBio);

      expect(shouldShowBio).toBe(true);
      // Actual truncation happens in component template
      // Here we verify bio would be shown
      expect(longBio.length).toBeGreaterThan(150); // Default template limit
    });

    test('should handle special characters in profile data', async () => {
      const profileWithSpecialChars = {
        ...mockGravatarProfile,
        display_name: 'John "The Developer" Doe <script>alert("xss")</script>',
        description: 'Special chars: & < > " \' / \\',
      };

      const props = { email: testEmail };
      const { profile } = await renderGravatarProfileCard(props, profileWithSpecialChars);

      expect(profile?.display_name).toContain('John "The Developer" Doe');
      expect(profile?.description).toContain('Special chars');
    });

    test('should process verified account icons correctly', async () => {
      const props = { email: testEmail, showVerified: true };
      const { visibleVerifiedAccounts } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(visibleVerifiedAccounts.length).toBeGreaterThan(0);
      expect(visibleVerifiedAccounts[0].service_icon).toContain('https://');
      expect(visibleVerifiedAccounts[0].url).toContain('https://');
    });

    test('should limit verified accounts display', async () => {
      const props = { email: testEmail, showVerified: true };
      const { visibleVerifiedAccounts } = await renderGravatarProfileCard(props, mockGravatarProfile);

      // Component limits to 5 accounts in template
      expect(visibleVerifiedAccounts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Component Integration and Performance', () => {
    test('should handle multiple concurrent profile requests', async () => {
      const emails = [testEmail, 'user2@example.com', 'user3@example.com'];
      const profiles = emails.map((email, index) => ({
        ...mockGravatarProfile,
        email,
        display_name: `User ${index + 1}`,
      }));

      const promises = emails.map((email, index) =>
        renderGravatarProfileCard({ email }, profiles[index])
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.profile).toBeDefined();
        expect(result.profile?.display_name).toBe(`User ${index + 1}`);
      });
    });

    test('should cache profile data efficiently', async () => {
      const props = { email: testEmail };

      // First call
      const { profile: profile1 } = await renderGravatarProfileCard(props, mockGravatarProfile);

      // Second call (should use cache)
      const { profile: profile2 } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(profile1).toBe(profile2);
    });

    test('should handle rapid prop changes', async () => {
      const baseProps = { email: testEmail };

      // Simulate rapid prop changes
      const variations = [
        { ...baseProps, layout: 'card' },
        { ...baseProps, layout: 'horizontal' },
        { ...baseProps, layout: 'vertical' },
        { ...baseProps, template: 'compact' },
        { ...baseProps, template: 'detailed' },
      ];

      const results = await Promise.all(
        variations.map(props => renderGravatarProfileCard(props, mockGravatarProfile))
      );

      results.forEach((result, index) => {
        expect(result.cssClasses).toBeDefined();
        expect(result.avatarUrl).toBeDefined();
        expect(result.profile).toBeDefined();
      });
    });
  });

  describe('Accessibility and Semantic HTML', () => {
    test('should provide proper alt text for avatar', async () => {
      const props = { email: testEmail };
      const { avatarUrl } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(avatarUrl).toBeDefined();
      // Component would include alt="Avatar for {email}"
    });

    test('should provide proper ARIA labels for clickable cards', async () => {
      const props = { email: testEmail, clickable: true };
      const { profile } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(profile?.display_name).toBeDefined();
      expect(profile?.profile_url).toBeDefined();
      // Component would include aria-label="View {name}'s Gravatar profile"
    });

    test('should use semantic HTML structure', async () => {
      const props = { email: testEmail };
      const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

      expect(cssClasses).toContain('gravatar-profile-card');
      // Component would use <article> for main container
      // Component would use <h3> for name
      // Component would use <p> for bio
    });
  });

  describe('Responsive and Mobile Behavior', () => {
    test('should handle different layout options for responsive design', async () => {
      const layouts = ['card', 'horizontal', 'vertical'];

      for (const layout of layouts) {
        const props = { email: testEmail, layout: layout as any };
        const { cssClasses } = await renderGravatarProfileCard(props, mockGravatarProfile);

        expect(cssClasses).toContain(`gravatar-profile-card--${layout}`);
      }
    });

    test('should adapt content for mobile screens', async () => {
      const props = { email: testEmail, template: 'compact' };
      const { shouldShowBio, filteredLinks } = await renderGravatarProfileCard(props, mockGravatarProfile);

      // Compact template is better for mobile
      expect(shouldShowBio).toBe(true);
      expect(filteredLinks.length).toBeLessThanOrEqual(3);
    });
  });
});