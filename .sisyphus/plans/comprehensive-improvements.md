# Comprehensive Codebase Improvements

## TL;DR

> **Quick Summary**: Comprehensive improvements across 4 areas: test coverage enhancement (90.69% → 95%+), new features (Request Deduplication, Rate Limiting Queue, CLI Tool), developer experience (ESLint/Prettier), and infrastructure (Dependabot, security scanning, bundle monitoring).
> 
> **Deliverables**:
> - Test coverage ≥95% for all files (test-helpers.ts, mocks.ts, hash.ts)
> - Request Deduplication utility with SSR-safe global state
> - Rate Limiting Queue extending existing GravatarClient
> - CLI tool for offline URL generation (`bun run cli generate-avatar`)
> - ESLint + Prettier configuration with CI enforcement
> - Dependabot, security scanning, bundle size monitoring in CI
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 5 phases with internal parallelization
> **Critical Path**: Tests → ESLint → Features → CLI → Infrastructure

---

## Context

### Original Request
User requested comprehensive improvements across all 4 areas:
1. Test Coverage Enhancement (90.69% → 95%+, TDD approach)
2. New Features (Request Deduplication, Rate Limiting Queue, CLI Tool)
3. Developer Experience (ESLint, Prettier)
4. Infrastructure/CI (Dependabot, security scanning, bundle monitoring)

### Interview Summary
**Key Discussions**:
- Test coverage: Critical gaps in test-helpers.ts (53.50%), mocks.ts (73.28%), hash.ts (85.71%)
- Features: Request Deduplication (per-request scope), Rate Limiting Queue (extend existing), CLI Tool (offline URL generation)
- DX: ESLint with Standard preset + TypeScript rules, Prettier for formatting
- CI: GitHub Actions maintained, add Dependabot, `bun audit`, bundle size checks

**Research Findings**:
- GravatarClient already has `rateLimit.maxConcurrent` - new queue should EXTEND, not replace
- Existing test patterns: mock factories, fixtures, setupTestEnvironment
- CLI should be separate entry point to avoid bundle bloat
- Deduplication must be SSR-safe (no global singletons that persist across requests)

### Metis Review
**Identified Gaps** (addressed):
- **CLI Scope**: Offline URL generation only, no interactive mode ✅
- **Deduplication Scope**: Per-request scope, TTL-based cleanup ✅
- **Rate Limiting**: Extend existing GravatarClient logic ✅
- **ESLint Base**: @typescript-eslint/recommended as base ✅
- **Bundle Threshold**: <50KB uncompressed for main entry ✅

**Risk Mitigations Applied**:
- CLI in separate entry point (`astro-gravatar/cli`)
- Deduplication uses request-scoped state with TTL
- Each feature phase independently mergeable with full tests

---

## Work Objectives

### Core Objective
Comprehensive codebase quality improvements across testing, features, developer experience, and infrastructure without breaking existing API.

### Concrete Deliverables
- `test-utils/test-helpers.ts`: 95%+ coverage
- `src/__tests__/mocks.ts`: 95%+ coverage  
- `src/utils/hash.ts`: 95%+ function coverage
- `src/lib/deduplication.ts`: Request deduplication utility
- `src/lib/rate-limit-queue.ts`: Rate limiting queue class
- `src/cli/index.ts`: CLI entry point
- `.eslintrc.js`, `.prettierrc`: Linting/formatting config
- `.github/dependabot.yml`: Dependency updates automation
- Updated CI workflow with security and bundle checks

### Definition of Done
- [x] `bun test --coverage` reports ≥95% for all files
- [x] `bunx eslint . --max-warnings=0` exits 0
- [x] `bunx prettier --check .` exits 0
- [x] `bun run cli generate-avatar --email=test@example.com` outputs valid URL
- [x] `bun audit` passes (no vulnerabilities)
- [x] Bundle size < 50KB for main entry

### Must Have
- TDD workflow for all new code (RED-GREEN-REFACTOR)
- All new code ≥95% test coverage
- Backward compatibility (no breaking changes)
- SSR-safe deduplication (no cross-request contamination)
- CLI as separate entry point

### Must NOT Have (Guardrails)
- **Breaking changes**: All improvements must be backward compatible
- **Bundle bloat**: CLI code must NOT be included in main package
- **Global singletons**: No SSR-unsafe global state
- **Over-testing**: Test PUBLIC exports only, not internal helpers
- **AI slop patterns**:
  - Don't add "interactive mode" to CLI (offline URL generation only)
  - Don't add 50+ ESLint rules (Standard + TypeScript only)
  - Don't split into micro-packages (single package, separate entry)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun test

### TDD Workflow (MANDATORY)

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Agent-Executed QA Scenarios (MANDATORY)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Library/Module** | Bash (bun test) | Run tests, check coverage |
| **CLI Tool** | Bash (bun run cli) | Execute commands, parse output |
| **Config/Infra** | Bash (shell commands) | Verify files exist, run linters |

---

## Execution Strategy

### Phase Overview

```
Phase 1 (Foundation): Test Coverage Enhancement
├── Task 1.1: test-helpers.ts coverage (53.50% → 95%)
├── Task 1.2: mocks.ts coverage (73.28% → 95%)
└── Task 1.3: hash.ts coverage (85.71% → 95%)

Phase 2 (Low Risk, High Value): Developer Experience
├── Task 2.1: ESLint configuration
├── Task 2.2: Prettier configuration
└── Task 2.3: CI lint enforcement

Phase 3 (Core Features): Request Handling Improvements
├── Task 3.1: Request Deduplication utility
└── Task 3.2: Rate Limiting Queue (extend GravatarClient)

Phase 4 (Tooling): CLI Tool
└── Task 4.1: CLI for offline URL generation

Phase 5 (Infrastructure): CI/CD Enhancements
├── Task 5.1: Dependabot configuration
├── Task 5.2: Security scanning (bun audit)
└── Task 5.3: Bundle size monitoring

Critical Path: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Phases 1-2 can partially overlap; Phases 3-5 depend on Phase 1 completion
```

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Independent):
├── Phase 1.1: test-helpers.ts tests
├── Phase 1.2: mocks.ts tests
├── Phase 1.3: hash.ts tests
└── Phase 2.1: ESLint config (no code dependencies)

Wave 2 (After Wave 1):
├── Phase 2.2: Prettier config
├── Phase 2.3: CI lint job
└── Phase 3.1: Request Deduplication (TDD)

Wave 3 (After Wave 2):
├── Phase 3.2: Rate Limiting Queue (TDD)
└── Phase 4.1: CLI Tool (TDD)

Wave 4 (After Wave 3):
├── Phase 5.1: Dependabot
├── Phase 5.2: Security scanning
└── Phase 5.3: Bundle size monitoring
```

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

---

## Phase 1: Test Coverage Enhancement

### Task 1.1: test-helpers.ts Coverage (53.50% → 95%)

**What to do**:
- [x] RED: Write failing tests for untested functions
- [x] Cover all PUBLIC exports:
  - `setupTestEnvironment()` - multiple calls should not stack mocks
  - `createFetchMock()` - overlapping URL patterns
  - `setupFetchWithResponses()` - cleanup behavior
  - `expectCssClasses()` - various class combinations
  - `setupMockDOM()` - DOM manipulation scenarios
  - `createMockEvent()` - event creation patterns
  - `measureTime()` - functions that never resolve
  - `benchmark()` - async functions that throw errors
- [x] GREEN: Ensure all tests pass
- [x] REFACTOR: Clean up test code

**Must NOT do**:
- Don't test internal helper functions (only PUBLIC exports)
- Don't add new test utilities

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
  - Reason: Test writing following existing patterns
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1.2, 1.3, 2.1)
- **Blocks**: Phase 3+
- **Blocked By**: None

**References**:
- `packages/astro-gravatar/test-utils/test-helpers.ts` - Functions to test
- `packages/astro-gravatar/src/__tests__/*.test.ts` - Existing test patterns
- `packages/astro-gravatar/src/__tests__/fixtures.ts` - Test fixtures

**Acceptance Criteria**:
- [x] Test file: `test-utils/test-helpers.test.ts` created
- [x] `bun test test-utils/test-helpers.test.ts` → PASS
- [x] Coverage: test-helpers.ts ≥95%

**Agent-Executed QA Scenarios**:
```
Scenario: test-helpers.ts achieves 95% coverage
  Tool: Bash (bun test)
  Preconditions: Tests written for all public functions
  Steps:
    1. Run: cd packages/astro-gravatar && bun test --coverage test-utils/test-helpers.test.ts
    2. Parse coverage output for test-helpers.ts
    3. Assert: Line coverage >= 95
  Expected Result: Coverage report shows >= 95%
  Evidence: Coverage output captured
```

**Commit**: YES
- Message: `test(helpers): add comprehensive tests for test-helpers.ts (95%+ coverage)`
- Files: `test-utils/test-helpers.test.ts`
- Pre-commit: `bun test test-utils/test-helpers.test.ts`

---

### Task 1.2: mocks.ts Coverage (73.28% → 95%)

**What to do**:
- [x] RED: Write failing tests for untested paths
- [x] Cover error mock scenarios:
  - `createMockFetch()` edge cases (network errors, timeouts)
  - `setupFetchMock()` cleanup behavior
  - Error response generators
- [x] GREEN: Ensure all tests pass
- [x] REFACTOR: Clean up test code

**Must NOT do**:
- Don't modify existing mock implementations

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
  - Reason: Test writing following existing patterns
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1.1, 1.3, 2.1)
- **Blocks**: Phase 3+
- **Blocked By**: None

**References**:
- `packages/astro-gravatar/src/__tests__/mocks.ts` - Mocks to test
- `packages/astro-gravatar/src/__tests__/*.test.ts` - Existing test patterns

**Acceptance Criteria**:
- [x] Test file: `src/__tests__/mocks.test.ts` created or updated
- [x] `bun test src/__tests__/mocks.test.ts` → PASS
- [x] Coverage: mocks.ts ≥95%

**Agent-Executed QA Scenarios**:
```
Scenario: mocks.ts achieves 95% coverage
  Tool: Bash (bun test)
  Preconditions: Tests written for error paths
  Steps:
    1. Run: cd packages/astro-gravatar && bun test --coverage src/__tests__/mocks.test.ts
    2. Parse coverage output for mocks.ts
    3. Assert: Line coverage >= 95
  Expected Result: Coverage report shows >= 95%
  Evidence: Coverage output captured
```

**Commit**: YES
- Message: `test(mocks): add tests for error mock scenarios (95%+ coverage)`
- Files: `src/__tests__/mocks.test.ts`
- Pre-commit: `bun test src/__tests__/mocks.test.ts`

---

### Task 1.3: hash.ts Coverage (85.71% → 95%)

**What to do**:
- [x] RED: Write failing tests for uncovered function paths
- [x] Cover edge cases:
  - `hashEmails([])` - empty array
  - `extractHash()` with malformed URLs
  - Cache eviction during concurrent access
  - In-flight deduplication (already exists, verify coverage)
- [x] GREEN: Ensure all tests pass
- [x] REFACTOR: Clean up test code

**Must NOT do**:
- Don't modify existing hash implementation

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
  - Reason: Test writing following existing patterns
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1.1, 1.2, 2.1)
- **Blocks**: Phase 3+
- **Blocked By**: None

**References**:
- `packages/astro-gravatar/src/utils/hash.ts` - Functions to test
- `packages/astro-gravatar/src/utils/__tests__/hash.test.ts` - Existing tests

**Acceptance Criteria**:
- [x] Test file updated: `src/utils/__tests__/hash.test.ts`
- [x] `bun test src/utils/__tests__/hash.test.ts` → PASS
- [x] Coverage: hash.ts functions ≥95%

**Agent-Executed QA Scenarios**:
```
Scenario: hash.ts achieves 95% function coverage
  Tool: Bash (bun test)
  Preconditions: Tests written for edge cases
  Steps:
    1. Run: cd packages/astro-gravatar && bun test --coverage src/utils/__tests__/hash.test.ts
    2. Parse function coverage output for hash.ts
    3. Assert: Function coverage >= 95
  Expected Result: Coverage report shows >= 95%
  Evidence: Coverage output captured
```

**Commit**: YES
- Message: `test(hash): add edge case tests (95%+ function coverage)`
- Files: `src/utils/__tests__/hash.test.ts`
- Pre-commit: `bun test src/utils/__tests__/hash.test.ts`

---

## Phase 2: Developer Experience

### Task 2.1: ESLint Configuration

**What to do**:
- [x] Create `.eslintrc.js` with:
  - Base: `@typescript-eslint/recommended`
  - Additional rules: `no-unused-vars`, `prefer-const`
  - Astro plugin for `.astro` files
- [x] Add lint script to package.json
- [x] Run initial lint and fix trivial issues
- [x] Document in README

**Must NOT do**:
- Don't add 50+ rules (keep it standard)
- Don't break existing code

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Configuration file creation
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1.1, 1.2, 1.3)
- **Blocks**: Task 2.3
- **Blocked By**: None

**References**:
- `packages/astro-gravatar/package.json` - Add lint script
- Similar Astro projects for ESLint config patterns

**Acceptance Criteria**:
- [x] `.eslintrc.js` exists
- [x] `bunx eslint packages/astro-gravatar/src --max-warnings=0` exits 0
- [x] README updated with lint instructions

**Agent-Executed QA Scenarios**:
```
Scenario: ESLint runs without errors
  Tool: Bash (bunx eslint)
  Preconditions: .eslintrc.js created
  Steps:
    1. Install: bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    2. Run: bunx eslint packages/astro-gravatar/src --max-warnings=0
    3. Check exit code: echo $?
  Expected Result: Exit code 0 (no errors or warnings)
  Evidence: Lint output captured
```

**Commit**: YES
- Message: `chore(lint): add ESLint configuration with TypeScript support`
- Files: `.eslintrc.js`, `package.json`
- Pre-commit: `bunx eslint packages/astro-gravatar/src`

---

### Task 2.2: Prettier Configuration

**What to do**:
- [x] Create `.prettierrc` with standard settings
- [x] Create `.prettierignore`
- [x] Add format scripts to package.json
- [x] Format existing code
- [x] Document in README

**Must NOT do**:
- Don't use controversial settings
- Don't reformat test fixtures (might break snapshots)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Configuration file creation
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: NO (depends on ESLint for consistency)
- **Parallel Group**: Wave 2
- **Blocks**: Task 2.3
- **Blocked By**: Task 2.1

**References**:
- `packages/astro-gravatar/package.json` - Add format scripts

**Acceptance Criteria**:
- [x] `.prettierrc` exists
- [x] `bunx prettier --check "packages/astro-gravatar/src/**/*.{ts,astro}"` exits 0
- [x] README updated with format instructions

**Agent-Executed QA Scenarios**:
```
Scenario: Prettier runs without errors
  Tool: Bash (bunx prettier)
  Preconditions: .prettierrc created, code formatted
  Steps:
    1. Install: bun add -d prettier
    2. Run: bunx prettier --check "packages/astro-gravatar/src/**/*.{ts,astro}"
    3. Check exit code: echo $?
  Expected Result: Exit code 0 (all files formatted)
  Evidence: Prettier output captured
```

**Commit**: YES
- Message: `chore(format): add Prettier configuration and format codebase`
- Files: `.prettierrc`, `.prettierignore`, `package.json`, all formatted files
- Pre-commit: `bunx prettier --check .`

---

### Task 2.3: CI Lint Enforcement

**What to do**:
- [x] Add lint job to `.github/workflows/ci.yml`
- [x] Fail CI on lint errors
- [x] Add format check job

**Must NOT do**:
- Don't make lint job slower than test job

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: CI configuration update
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 2
- **Blocks**: None
- **Blocked By**: Tasks 2.1, 2.2

**References**:
- `.github/workflows/ci.yml` - Existing CI config
- `.github/workflows/release.yml` - Release workflow

**Acceptance Criteria**:
- [x] CI workflow includes lint job
- [x] CI fails on lint errors (testable via PR)

**Agent-Executed QA Scenarios**:
```
Scenario: CI lint job configured correctly
  Tool: Bash (grep)
  Preconditions: .github/workflows/ci.yml updated
  Steps:
    1. Verify lint job exists: grep -A 10 "lint:" .github/workflows/ci.yml
    2. Verify eslint command: grep "eslint" .github/workflows/ci.yml
    3. Verify prettier command: grep "prettier" .github/workflows/ci.yml
  Expected Result: Lint and format jobs configured
  Evidence: Grep output captured
```

**Commit**: YES
- Message: `ci: add lint and format checks to CI workflow`
- Files: `.github/workflows/ci.yml`
- Pre-commit: None

---

## Phase 3: Core Features

### Task 3.1: Request Deduplication Utility

**What to do**:
- [x] RED: Write failing tests for deduplication
  - Same email requested simultaneously → single API call
  - Different emails → separate API calls
  - TTL expiration → new API call allowed
  - SSR context → no cross-request contamination
- [x] Create `src/lib/deduplication.ts`:
  - `RequestDeduplicator` class
  - `deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T>`
  - TTL-based cleanup (default: 5000ms)
  - Request-scoped (not global singleton)
- [x] Integrate with `GravatarClient.getProfile()`
- [x] GREEN: All tests pass
- [x] REFACTOR: Clean up

**Must NOT do**:
- Don't create global singletons (SSR-unsafe)
- Don't break existing GravatarClient API

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Utility class implementation with clear requirements
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 2
- **Blocks**: Task 3.2
- **Blocked By**: Phase 1 (tests for existing code)

**References**:
- `packages/astro-gravatar/src/lib/GravatarClient.ts` - Integration point
- `packages/astro-gravatar/src/utils/hash.ts` - In-flight deduplication pattern

**Acceptance Criteria**:
- [x] Test file: `src/lib/__tests__/deduplication.test.ts`
- [x] `bun test src/lib/__tests__/deduplication.test.ts` → PASS
- [x] Coverage: deduplication.ts ≥95%
- [x] GravatarClient uses deduplication

**Agent-Executed QA Scenarios**:
```
Scenario: Deduplication prevents duplicate API calls
  Tool: Bash (bun test)
  Preconditions: Deduplication implemented
  Steps:
    1. Run test: bun test src/lib/__tests__/deduplication.test.ts
    2. Verify test "same email requested simultaneously" passes
    3. Verify coverage: bun test --coverage src/lib/__tests__/deduplication.test.ts
  Expected Result: Deduplication tests pass with high coverage
  Evidence: Test output captured

Scenario: GravatarClient uses deduplication
  Tool: Bash (bun test)
  Preconditions: GravatarClient integration complete
  Steps:
    1. Run test: bun test src/lib/__tests__/GravatarClient.test.ts
    2. Verify deduplication behavior in client tests
  Expected Result: Client tests pass with deduplication
  Evidence: Test output captured
```

**Commit**: YES
- Message: `feat(dedup): add request deduplication utility with SSR-safe state`
- Files: `src/lib/deduplication.ts`, `src/lib/__tests__/deduplication.test.ts`, `src/lib/GravatarClient.ts`
- Pre-commit: `bun test src/lib/__tests__/deduplication.test.ts`

---

### Task 3.2: Rate Limiting Queue (Extend GravatarClient)

**What to do**:
- [x] RED: Write failing tests for queue behavior
  - Max concurrent requests respected
  - Queue processes requests in order
  - Failed requests don't block queue
  - Rate limit headers respected
- [x] Enhance `GravatarClient` with:
  - `RateLimitQueue` class
  - Priority queue support (optional)
  - Automatic retry on rate limit (already exists, verify)
  - Configurable concurrency
- [x] GREEN: All tests pass
- [x] REFACTOR: Clean up

**Must NOT do**:
- Don't replace existing rate limit logic (EXTEND only)
- Don't break existing GravatarClient API

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Extending existing class with additional features
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Task 3.1

**References**:
- `packages/astro-gravatar/src/lib/GravatarClient.ts` - Existing rate limit logic
- `packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts` - Existing tests

**Acceptance Criteria**:
- [x] Test file updated: `src/lib/__tests__/GravatarClient.test.ts`
- [x] `bun test src/lib/__tests__/GravatarClient.test.ts` → PASS
- [x] Coverage: GravatarClient.ts ≥95%
- [x] Queue respects maxConcurrent config

**Agent-Executed QA Scenarios**:
```
Scenario: Rate limiting queue respects concurrency limit
  Tool: Bash (bun test)
  Preconditions: Queue implemented
  Steps:
    1. Run test: bun test src/lib/__tests__/GravatarClient.test.ts -t "queue"
    2. Verify max concurrent requests test passes
  Expected Result: Queue tests pass
  Evidence: Test output captured

Scenario: Existing GravatarClient tests still pass
  Tool: Bash (bun test)
  Preconditions: Queue integrated
  Steps:
    1. Run all client tests: bun test src/lib/__tests__/GravatarClient.test.ts
    2. Check for any failures
  Expected Result: All tests pass (no regression)
  Evidence: Test output captured
```

**Commit**: YES
- Message: `feat(queue): add rate limiting queue to GravatarClient`
- Files: `src/lib/GravatarClient.ts`, `src/lib/__tests__/GravatarClient.test.ts`
- Pre-commit: `bun test src/lib/__tests__/GravatarClient.test.ts`

---

## Phase 4: CLI Tool

### Task 4.1: CLI for Offline URL Generation

**What to do**:
- [x] RED: Write failing tests for CLI commands
- [x] Create `src/cli/index.ts`:
  - `generate-avatar --email <email> [--size <size>] [--rating <rating>]`
  - `generate-qr --email <email> [--size <size>] [--version <1|3>]`
  - Output: JSON to stdout with URL
  - Error handling for invalid inputs
- [x] Add CLI entry to package.json exports:
  ```json
  "./cli": {
    "types": "./src/cli/index.ts",
    "import": "./src/cli/index.ts"
  }
  ```
- [x] Add `bin` field for executable
- [x] Document in README
- [x] GREEN: All tests pass
- [x] REFACTOR: Clean up

**Must NOT do**:
- Don't add interactive mode (offline only)
- Don't bundle CLI into main package
- Don't make network calls (offline URL generation)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: CLI implementation with clear command structure
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Wave 3
- **Blocks**: None
- **Blocked By**: Phase 1 (tests)

**References**:
- `packages/astro-gravatar/src/lib/gravatar.ts` - URL building functions
- `packages/astro-gravatar/package.json` - Entry point config

**Acceptance Criteria**:
- [x] Test file: `src/cli/__tests__/index.test.ts`
- [x] `bun test src/cli/__tests__/index.test.ts` → PASS
- [x] Coverage: cli/index.ts ≥95%
- [x] `bun run cli generate-avatar --email=test@example.com` outputs valid URL
- [x] CLI is separate entry point (not in main bundle)

**Agent-Executed QA Scenarios**:
```
Scenario: CLI generates valid avatar URL
  Tool: Bash (bun run cli)
  Preconditions: CLI implemented
  Steps:
    1. Run: bun run packages/astro-gravatar/src/cli/index.ts generate-avatar --email=test@example.com --size=80
    2. Parse output as JSON
    3. Assert: url matches /gravatar\.com\/avatar\/[a-f0-9]{64}/
  Expected Result: Valid Gravatar URL output
  Evidence: CLI output captured

Scenario: CLI generates valid QR URL
  Tool: Bash (bun run cli)
  Preconditions: CLI implemented
  Steps:
    1. Run: bun run packages/astro-gravatar/src/cli/index.ts generate-qr --email=test@example.com --size=150
    2. Parse output as JSON
    3. Assert: url contains "qr-code"
  Expected Result: Valid QR code URL output
  Evidence: CLI output captured

Scenario: CLI handles invalid email
  Tool: Bash (bun run cli)
  Preconditions: CLI implemented
  Steps:
    1. Run: bun run packages/astro-gravatar/src/cli/index.ts generate-avatar --email=invalid
    2. Check exit code
    3. Assert: Exit code non-zero, error message shown
  Expected Result: Error message for invalid input
  Evidence: CLI output captured
```

**Commit**: YES
- Message: `feat(cli): add CLI tool for offline URL generation`
- Files: `src/cli/index.ts`, `src/cli/__tests__/index.test.ts`, `package.json`
- Pre-commit: `bun test src/cli/__tests__/index.test.ts`

---

## Phase 5: Infrastructure

### Task 5.1: Dependabot Configuration

**What to do**:
- [x] Create `.github/dependabot.yml`:
  - Weekly updates for npm dependencies
  - Group minor/patch updates
  - Limit open PRs to 5
- [x] Test by pushing to branch

**Must NOT do**:
- Don't enable for all ecosystems (npm only)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: Configuration file creation
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 4 (with Tasks 5.2, 5.3)
- **Blocks**: None
- **Blocked By**: Phase 3

**References**:
- GitHub Dependabot documentation
- `.github/workflows/` - Existing workflow patterns

**Acceptance Criteria**:
- [x] `.github/dependabot.yml` exists
- [x] Valid YAML syntax
- [x] Configured for npm ecosystem

**Agent-Executed QA Scenarios**:
```
Scenario: Dependabot configuration is valid
  Tool: Bash (test + grep)
  Preconditions: .github/dependabot.yml created
  Steps:
    1. Verify file exists: test -f .github/dependabot.yml && echo "exists"
    2. Verify npm ecosystem: grep "package-ecosystem.*npm" .github/dependabot.yml
    3. Verify interval: grep "interval" .github/dependabot.yml
  Expected Result: Valid Dependabot configuration
  Evidence: Grep output captured
```

**Commit**: YES
- Message: `ci: add Dependabot configuration for automated dependency updates`
- Files: `.github/dependabot.yml`
- Pre-commit: None

---

### Task 5.2: Security Scanning (bun audit)

**What to do**:
- [x] Add `bun audit` to CI workflow
- [x] Add security scan script to package.json
- [x] Configure to fail on high/critical vulnerabilities
- [x] Document in README

**Must NOT do**:
- Don't add Snyk (bun audit is sufficient)
- Don't fail on low/medium vulnerabilities (noise)

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: CI workflow update
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 4 (with Tasks 5.1, 5.3)
- **Blocks**: None
- **Blocked By**: Phase 3

**References**:
- `.github/workflows/ci.yml` - Existing CI config
- Bun audit documentation

**Acceptance Criteria**:
- [x] CI workflow includes `bun audit` step
- [x] `bun audit` exits 0 (no vulnerabilities)
- [x] README updated with security policy

**Agent-Executed QA Scenarios**:
```
Scenario: Security scan runs in CI
  Tool: Bash (grep)
  Preconditions: CI workflow updated
  Steps:
    1. Verify audit command: grep "bun audit" .github/workflows/ci.yml
  Expected Result: CI includes security scan
  Evidence: Grep output captured

Scenario: No current vulnerabilities
  Tool: Bash (bun audit)
  Preconditions: Dependencies installed
  Steps:
    1. Run: bun audit
    2. Check exit code
  Expected Result: Exit code 0 (no vulnerabilities)
  Evidence: Audit output captured
```

**Commit**: YES
- Message: `ci(security): add bun audit to CI workflow`
- Files: `.github/workflows/ci.yml`, `package.json`, `README.md`
- Pre-commit: `bun audit`

---

### Task 5.3: Bundle Size Monitoring

**What to do**:
- [x] Add bundle size check to CI
- [x] Set threshold: <50KB uncompressed for main entry
- [x] Fail CI if threshold exceeded
- [x] Report bundle size in PR comments (optional)

**Must NOT do**:
- Don't fail on minor size increases (<1KB)
- Don't add complex bundle analysis tools

**Recommended Agent Profile**:
- **Category**: `quick`
  - Reason: CI workflow update
- **Skills**: None required

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 4 (with Tasks 5.1, 5.2)
- **Blocks**: None
- **Blocked By**: Phase 3

**References**:
- `.github/workflows/ci.yml` - Existing CI config
- Bun build documentation

**Acceptance Criteria**:
- [x] CI workflow includes bundle size check
- [x] Threshold: 50KB
- [x] Fails if exceeded

**Agent-Executed QA Scenarios**:
```
Scenario: Bundle size is within threshold
  Tool: Bash (bun build)
  Preconditions: Package can be built
  Steps:
    1. Build: cd packages/astro-gravatar && bun build index.ts --outfile=/tmp/bundle.js
    2. Check size: stat -c%s /tmp/bundle.js
    3. Assert: Size < 50000
  Expected Result: Bundle under 50KB
  Evidence: Size output captured

Scenario: Bundle size check in CI
  Tool: Bash (grep)
  Preconditions: CI workflow updated
  Steps:
    1. Verify bundle check: grep -i "bundle\|size" .github/workflows/ci.yml
  Expected Result: CI includes bundle size check
  Evidence: Grep output captured
```

**Commit**: YES
- Message: `ci(bundle): add bundle size monitoring to CI`
- Files: `.github/workflows/ci.yml`
- Pre-commit: None

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1.1 | `test(helpers): add comprehensive tests for test-helpers.ts (95%+ coverage)` | test-utils/test-helpers.test.ts | `bun test test-helpers.test.ts` |
| 1.2 | `test(mocks): add tests for error mock scenarios (95%+ coverage)` | src/__tests__/mocks.test.ts | `bun test mocks.test.ts` |
| 1.3 | `test(hash): add edge case tests (95%+ function coverage)` | src/utils/__tests__/hash.test.ts | `bun test hash.test.ts` |
| 2.1 | `chore(lint): add ESLint configuration with TypeScript support` | .eslintrc.js, package.json | `bunx eslint .` |
| 2.2 | `chore(format): add Prettier configuration and format codebase` | .prettierrc, all files | `bunx prettier --check .` |
| 2.3 | `ci: add lint and format checks to CI workflow` | .github/workflows/ci.yml | CI run |
| 3.1 | `feat(dedup): add request deduplication utility with SSR-safe state` | src/lib/deduplication.ts, tests | `bun test deduplication.test.ts` |
| 3.2 | `feat(queue): add rate limiting queue to GravatarClient` | src/lib/GravatarClient.ts, tests | `bun test GravatarClient.test.ts` |
| 4.1 | `feat(cli): add CLI tool for offline URL generation` | src/cli/index.ts, tests, package.json | `bun run cli --help` |
| 5.1 | `ci: add Dependabot configuration for automated dependency updates` | .github/dependabot.yml | File exists |
| 5.2 | `ci(security): add bun audit to CI workflow` | .github/workflows/ci.yml | `bun audit` |
| 5.3 | `ci(bundle): add bundle size monitoring to CI` | .github/workflows/ci.yml | Build check |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass with high coverage
bun test --coverage
# Expected: All files >= 95% coverage

# Lint passes
bunx eslint packages/astro-gravatar/src --max-warnings=0
# Expected: Exit code 0

# Format check passes
bunx prettier --check "packages/astro-gravatar/src/**/*.{ts,astro}"
# Expected: Exit code 0

# CLI works
bun run packages/astro-gravatar/src/cli/index.ts generate-avatar --email=test@example.com
# Expected: JSON output with valid Gravatar URL

# Security scan passes
bun audit
# Expected: Exit code 0

# Bundle size within threshold
cd packages/astro-gravatar && bun build index.ts --outfile=/tmp/bundle.js && stat -c%s /tmp/bundle.js
# Expected: < 50000 bytes
```

### Final Checklist
- [x] All test coverage files ≥95%
- [x] ESLint configured and passing
- [x] Prettier configured and passing
- [x] Request Deduplication working
- [x] Rate Limiting Queue working
- [x] CLI tool functional
- [x] Dependabot configured
- [x] Security scanning in CI
- [x] Bundle size monitoring in CI
- [x] No breaking changes to existing API
- [x] All documentation updated
