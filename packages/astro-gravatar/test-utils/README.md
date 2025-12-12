# Test Utilities for astro-gravatar

This directory contains comprehensive testing utilities for the astro-gravatar package. It provides mocks, fixtures, and helper functions to make testing easier and more consistent.

## Files Overview

### `mock-responses.ts`
Comprehensive mock responses for the Gravatar API, including:
- Success responses with full profile data
- Error responses (404, 429, 500, etc.)
- Rate limit scenarios
- Edge cases and special conditions
- Response generators for dynamic testing

### `test-helpers.ts`
Common testing utilities and helper functions:
- Test environment setup utilities
- Fetch mocking functions
- Assertion helpers for Gravatar-specific validations
- Data generation utilities
- Async testing utilities (delay, timeout, retry)
- Component testing helpers
- Performance measurement tools

## Test Structure

### Directory Layout
```
src/
├── __tests__/
│   ├── setup.ts              # Global test configuration
│   ├── mocks.ts              # API mocks and fixtures
│   ├── fixtures.ts           # Sample data for testing
│   └── infrastructure.test.ts # Test infrastructure verification
├── utils/__tests__/          # Utility function tests
├── lib/__tests__/            # Core library tests
└── components/__tests__/     # Component tests
```

### Test File Naming
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.spec.ts` - Specification tests

## Available Test Scripts

From `package.json`:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run only unit tests
bun test:unit

# Run only integration tests
bun test:integration

# Run only component tests
bun test:components
```

## Using the Test Utilities

### Setting up a Test

```typescript
import { test, expect, describe } from 'bun:test';
import { setupTestEnvironment, generateRandomEmail } from '../../test-utils/test-helpers';
import { mockGravatarProfile } from '../__tests__/mocks';

// Set up the test environment
setupTestEnvironment();

describe('Your Component', () => {
  test('should work correctly', () => {
    const email = generateRandomEmail();
    // Your test logic here
  });
});
```

### Using Mocks

```typescript
import { mockSuccessfulProfileResponse, setupFetchMock } from '../__tests__/mocks';

test('should fetch profile successfully', async () => {
  const cleanup = setupFetchMock({
    'gravatar.com/profile': new Response(JSON.stringify(mockSuccessfulProfileResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  });

  try {
    // Your test code here
  } finally {
    cleanup();
  }
});
```

### Using Fixtures

```typescript
import { GRAVATAR_AVATAR_PROPS, VALID_EMAILS } from '../__tests__/fixtures';

test('should handle different props', () => {
  const props = GRAVATAR_AVATAR_PROPS.complete;
  // Test with complete props
});

test('should handle valid emails', () => {
  VALID_EMAILS.forEach(email => {
    // Test each valid email
  });
});
```

### Using Assertions

```typescript
import { expectSuccessfulResponse, expectValidGravatarProfile } from '../../test-utils/test-helpers';

test('should return valid profile', () => {
  const response = await fetchProfile();
  expectSuccessfulResponse(response);
  expectValidGravatarProfile(response.data);
});
```

## Mock Data

The test infrastructure includes comprehensive mock data:

### Profile Mocks
- `mockGravatarProfile` - Complete user profile with all fields
- `mockMinimalProfile` - Basic profile with required fields only
- `mockOrganizationProfile` - Organization profile example

### API Responses
- Success responses (200)
- Not found responses (404)
- Rate limited responses (429)
- Server error responses (500)
- Network error scenarios

### Email Fixtures
- `VALID_EMAILS` - Array of valid email formats
- `INVALID_EMAILS` - Array of invalid email formats
- `EDGE_CASE_EMAILS` - Edge case emails (empty, whitespace, etc.)

### Props Fixtures
- `GRAVATAR_AVATAR_PROPS` - Various avatar component props combinations
- `GRAVATAR_PROFILE_CARD_PROPS` - Profile card props variations
- `GRAVATAR_QR_PROPS` - QR code component props

## Configuration

### Test Configuration (`bun.config.ts`)
- Global preload file for test setup
- Coverage configuration with thresholds
- Test file patterns
- Timeout settings

### Environment Variables
Tests run with `NODE_ENV=test` automatically. Additional test-specific environment variables can be set in the setup file.

## Coverage

Coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/index.html`
- Text summary shown in console

Coverage thresholds are set at 80% for:
- Branches
- Functions
- Lines
- Statements

## Best Practices

1. **Use the provided utilities** - Leverage the mock responses and test helpers to ensure consistency
2. **Test edge cases** - Use the provided edge case fixtures for comprehensive testing
3. **Clean up mocks** - Always clean up fetch mocks after tests to avoid interference
4. **Follow naming conventions** - Use the established test file naming patterns
5. **Use descriptive test names** - Make it clear what each test is verifying
6. **Group related tests** - Use `describe` blocks to organize related test cases

## Examples

### Testing a Component

```typescript
import { test, expect } from 'bun:test';
import { createMockProps, expectCssClasses } from '../../test-utils/test-helpers';

test('should render avatar with correct classes', () => {
  const props = createMockProps({ class: 'custom-avatar', size: 128 });
  const element = renderGravatarAvatar(props);

  expectCssClasses(element, ['custom-avatar', 'gravatar-avatar']);
});
```

### Testing API Integration

```typescript
import { test, expect } from 'bun:test';
import { setupFetchWithResponses, expectSuccessfulResponse } from '../../test-utils/test-helpers';
import { mockResponses } from '../__tests__/mocks';

test('should handle API errors gracefully', async () => {
  const cleanup = setupFetchWithResponses({
    'gravatar.com/profile': mockResponses.notFound
  });

  try {
    const response = await fetchGravatarProfile('nonexistent@example.com');
    expect(response.status).toBe(404);
  } finally {
    cleanup();
  }
});
```

This comprehensive test infrastructure provides a solid foundation for testing the astro-gravatar package and ensures reliable, maintainable test coverage.