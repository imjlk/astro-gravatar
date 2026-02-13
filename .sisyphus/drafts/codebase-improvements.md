# Draft: Codebase Improvements

## Original Request
Work on 5 improvement areas:
1. Performance optimization - Fix srcset generation recalculation issue
2. Type safety improvements - Re-enable disabled TypeScript flags
3. Documentation updates - Update README for error code changes
4. Test coverage - Improve coverage for lower-covered modules
5. Code cleanup - Address magic numbers and minor refactoring items

## Requirements (confirmed)
- **Scope**: All 5 improvement areas in one comprehensive plan
- **TypeScript**: Enable all strict flags (aggressive approach)
- **Test Coverage**: Aim for comprehensive coverage (>90%)

## Technical Decisions
- **Plan Structure**: Single plan covering all 5 areas
- **TypeScript Strategy**: Re-enable all disabled flags and fix all resulting errors
- **Coverage Target**: >90% across all modules

## Research Findings

### 1. Performance - Srcset Hash Recalculation
**Location**: `packages/astro-gravatar/src/components/GravatarAvatar.astro` (lines 76-100)
**Issue**: generateSrcset calls buildAvatarUrl 3 times in parallel for sizes [1, 1.5, 2], each triggering hashEmailWithCache. While caching works after first hash completes, concurrent calls can trigger duplicate hash computations.
**Root Cause**: No in-flight request deduplication in hash.ts
**Fix Approach**: Add in-flight hash coalescing Map<string, Promise<string>> to hashEmailWithCache

### 2. TypeScript - Strict Flags
**Location**: `tsconfig.json` (root)
**Disabled Flags**:
- noUnusedLocals: false
- noUnusedParameters: false
- noPropertyAccessFromIndexSignature: false
**Other Files**: packages/astro-gravatar/tsconfig.json, apps/astro-gravatar.and.guide/tsconfig.json (extend astro/tsconfigs/strict)
**Action**: Enable all three disabled flags in root tsconfig.json, fix any resulting compilation errors

### 3. Documentation - Error Code Updates
**Files Needing Updates**:
- `gravatar-llms.md` - Section 12.2 Common Error Codes (needs INVALID_EMAIL, INVALID_RESPONSE)
- `apps/astro-gravatar.and.guide/src/content/docs/reference/components.md` - Error Codes section (lines 338-347)
- `packages/astro-gravatar/test-utils/README.md` - INVALID_EMAILS (should align with INVALID_EMAIL)
- `README.md` (root) - No error handling section exists
- `packages/astro-gravatar/README.md` - No error handling section exists
**Action**: Add error handling documentation to both READMEs, update error code tables

### 4. Test Coverage - >90% Target
**Current State**: No coverage report found in repo. README mentions 78.44% but no actual report.
**Test Files Found**:
- src/lib/__tests__/gravatar.test.ts
- src/lib/__tests__/GravatarClient.test.ts
- src/components/__tests__/GravatarAvatar.test.ts
- src/components/__tests__/GravatarProfileCard.test.ts
- src/components/__tests__/GravatarQR.test.ts
- src/utils/__tests__/hash.test.ts (extensive)
- src/__tests__/infrastructure.test.ts
**Action**: Generate coverage report (bun run test:coverage), identify gaps, add tests for low-coverage modules

### 5. Code Cleanup - Magic Numbers
**Magic Numbers Found**:
**gravatar.ts**: 1, 2048 (size bounds), 80 (default QR size), 10000 (timeout), 300 (TTL cap)
**GravatarClient.ts**: 300 (TTL), 100 (max size), 3 (max attempts), 1000 (base delay), 10000 (max delay), 2 (backoff), 0.1 (safety buffer), 10 (concurrency), 50 (jitter)
**hash.ts**: 5*60*1000 (5 min TTL), 1000 (max cache size)
**Action**: Create src/constants.ts with named constants, refactor all magic numbers

## Open Questions

## Test Strategy Decision
- **Infrastructure exists**: YES (bun test framework is configured)
- **Test Strategy**: TDD (User confirmed)
  - Write failing tests first (RED)
  - Implement minimum code to pass (GREEN)
  - Refactor while keeping green (REFACTOR)
  - Each task includes test cases in acceptance criteria

## CI Coverage Enforcement
- **Enforce in CI**: YES (User confirmed)
- **Action**: Add coverageThreshold configuration to fail builds if coverage drops below 90%

## Scope Boundaries
- INCLUDE: All 5 improvement areas
  1. Performance: Fix srcset hash recalculation (in-flight deduplication)
  2. Type Safety: Re-enable all disabled TypeScript flags (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)
  3. Documentation: Update READMEs and error code documentation
  4. Test Coverage: Generate report, identify gaps, achieve >90%
  5. Code Cleanup: Create constants.ts, refactor magic numbers
- EXCLUDE:
  - No major refactoring (only magic number extraction)
  - No API changes (only documentation updates)
