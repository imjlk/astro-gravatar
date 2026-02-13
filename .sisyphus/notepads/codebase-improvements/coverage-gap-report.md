# Coverage Gap Report - astro-gravatar

This report identifies files in the `packages/astro-gravatar` directory with coverage below the target of **90%** (statements, lines, functions, or branches).

## Overall Baseline
- **Overall Lines Coverage**: 90.60%
- **Overall Functions Coverage**: 82.40%
- **Test Results**: 300 passing tests

## Files Below 90% Coverage

### 1. Source Components (.astro files)
These files are not currently being tracked for coverage by the Bun test runner, effectively representing **0% coverage**.
- `packages/astro-gravatar/src/components/GravatarAvatar.astro`
- `packages/astro-gravatar/src/components/GravatarProfileCard.astro`
- `packages/astro-gravatar/src/components/GravatarQR.astro`

### 2. Core Source Files
- `packages/astro-gravatar/src/utils/hash.ts`
  - **Functions**: 85.71%
  - **Gaps**: Lines 60, 62-64, 159-161

### 3. Test Infrastructure & Utilities
While these are test-related files, they are currently included in the coverage report and fall significantly below the 90% threshold.
- `packages/astro-gravatar/test-utils/test-helpers.ts`
  - **Lines**: 53.50%
  - **Functions**: 58.82%
  - **Gaps**: 38-58, 78, 81-83, 126-128, 135-143, 150-160, 167-173, 180-183, 241-246, 265, 272-280, 287-304, 315-318, 328-340, 347-349
- `packages/astro-gravatar/src/__tests__/mocks.ts`
  - **Lines**: 73.28%
  - **Functions**: 0.00%
  - **Gaps**: 193-207, 215-265
- `packages/astro-gravatar/test-utils/mock-responses.ts`
  - **Coverage**: 0% (Missing from report)
- `packages/astro-gravatar/src/__tests__/setup.ts`
  - **Coverage**: 0% (Missing from report)

## Analysis of Gaps
- **Astro Components**: The current testing strategy for components (`GravatarAvatar.test.ts`, etc.) uses simulation and utility function testing rather than rendering the `.astro` files directly. This leads to a total lack of coverage for the actual `.astro` files.
- **Utility Gaps**: `src/utils/hash.ts` has specific uncovered lines related to error handling or edge cases in hashing.
- **Test Helpers**: A large portion of the test utility library is unused by the current test suite, suggesting either redundant code or missing test scenarios that would exercise these helpers.

## Next Steps (Task 4.2)
- Implement direct testing for `.astro` components (if possible with current toolset) or improve the simulation to cover more branches.
- Add tests for the uncovered logic in `src/utils/hash.ts`.
- Either prune unused test utilities or add tests that utilize the full range of helpers.
