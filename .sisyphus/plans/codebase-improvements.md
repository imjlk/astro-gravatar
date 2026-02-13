# Codebase Improvements

## TL;DR

> **Quick Summary**: Comprehensive codebase improvements across 5 areas: performance optimization (srcset hash deduplication), TypeScript strict mode enablement, documentation updates for error codes, test coverage expansion to >90% with TDD, and magic number extraction to constants module.
>
> **Deliverables**:
> - Fixed hash deduplication for parallel srcset generation
> - All TypeScript strict flags enabled with no compilation errors
> - Updated documentation reflecting error codes (INVALID_EMAIL, INVALID_RESPONSE)
> - >90% test coverage across all modules with CI enforcement
> - Centralized constants module replacing magic numbers
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Constants → Performance → TypeScript → Tests → Docs

---

## Context

### Original Request
User requested work on 5 improvement areas:
1. Performance optimization - Fix srcset generation hash recalculation issue
2. Type safety improvements - Re-enable disabled TypeScript flags (aggressive)
3. Documentation updates - Update README for error code changes
4. Test coverage - Achieve >90% coverage
5. Code cleanup - Address magic numbers and minor refactoring items

User confirmed:
- All 5 areas equally (comprehensive plan)
- Enable all strict flags (aggressive approach)
- >90% test coverage target with CI enforcement
- TDD approach (RED-GREEN-REFACTOR cycle)

### Interview Summary
**Key Discussions**:
- Performance: Identified concurrent hash computation issue in srcset generation
- TypeScript: Three disabled flags in root tsconfig (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)
- Documentation: Error codes already exist in types.ts; task is updating markdown documentation
- Testing: TDD workflow confirmed with CI coverage enforcement at 90%
- Cleanup: Extensive magic numbers identified across gravatar.ts, GravatarClient.ts, hash.ts

**Research Findings**:
- Performance issue: GravatarAvatar.astro generateSrcset calls buildAvatarUrl 3x in parallel; no in-flight deduplication in hash.ts
- TypeScript: Root tsconfig.json has disabled flags; no current compilation errors observed (tsc not available during research)
- Documentation: 5 files need updates for error codes; INVALID_EMAILS in test-utils/README.md should align
- Test coverage: No coverage report found; README mentions 78.44% but stale; 10 test files exist
- Cleanup: ~15 magic numbers identified across 3 core files

### Metis Review
**Identified Gaps** (addressed):
- **Race condition verification**: Current tests check results, not execution count. Need spy test to prove deduplication works. ✅ Added as Task 1.2 requirement
- **Strict mode noise**: Enabling flags will require many small fixes. ✅ Grouped as single task with verification
- **Magic number context**: Extract all meaningful constants (timeouts, sizes, limits). ✅ Constants module planned
- **Coverage baseline**: Generate coverage report first to identify real gaps. ✅ Task 4.1 added
- **Documentation scope**: Clarified that error codes exist in types.ts; task is purely updating markdown files. ✅ Task 3 scoped to docs only

---

## Work Objectives

### Core Objective
Comprehensive codebase quality improvements across performance, type safety, documentation, testing, and code maintainability.

### Concrete Deliverables
- In-flight hash deduplication in hashEmailWithCache
- All TypeScript strict flags enabled (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)
- Documentation updated: README.md, gravatar-llms.md, components.md, test-utils/README.md
- >90% test coverage with CI enforcement via coverageThreshold
- Central constants module (src/constants.ts) with all magic numbers extracted

### Definition of Done
- [x] `bun test --coverage` reports >90% coverage
- [x] `bun tsc --noEmit` completes with no errors
- [x] No magic numbers remain in core files (verified via grep for specific literals)
- [x] All documentation updated with error codes
- [x] Spy test proves hash deduplication (expect 1 digest call, not multiple)

### Must Have
- TDD workflow: RED (write failing test) → GREEN (implement) → REFACTOR (clean up)
- All tasks include Agent-Executed QA Scenarios (no human intervention)
- CI enforces 90%+ coverage threshold
- Constants module created before any refactoring uses it

### Must NOT Have (Guardrails)
- **Major API changes**: Only documentation updates, no code behavior changes
- **Breaking changes**: All improvements must be backward compatible
- **Test reduction**: Coverage must increase or stay same, never decrease
- **Incomplete migration**: If enabling flags requires fixes, all fixes must be committed together
- **AI slop patterns**:
  - Don't extract trivial constants like loop counters (0, 1) that aren't meaningful
  - Don't create over-abstracted utility functions for one-time use
  - Don't add "just in case" tests without clear purpose

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "User manually tests..." / "사용자가 직접 테스트..."
> - "User visually confirms..." / "사용자가 눈으로 확인..."
> - "User interacts with..." / "사용자가 직접 조작..."
> - "Ask user to verify..." / "사용자에게 확인 요청..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Playwright, interactive_bash, curl, etc.). No exceptions.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun test

### TDD Workflow (MANDATORY)

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `[path].test.ts`
   - Test command: `bun test [file]`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `bun test [file]`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `bun test [file]`
   - Expected: PASS (still)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Whether TDD is enabled or not, EVERY task MUST include Agent-Executed QA Scenarios.
> - **With TDD**: QA scenarios complement unit tests at integration/E2E level
> - **Without TDD**: QA scenarios are the PRIMARY verification method
>
> These describe how the executing agent DIRECTLY verifies the deliverable
> by running it — opening browsers, executing commands, sending API requests.
> The agent performs what a human tester would do, but automated via tools.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Library/Module** | Bash (bun/node REPL) | Import, call functions, compare output |
| **Config/Infra** | Bash (shell commands) | Apply config, run state checks, validate |

**Each Scenario MUST Follow This Format:**

```
Scenario: [Descriptive name — what user action/flow is being verified]
  Tool: [Bash / Playwright / interactive_bash]
  Preconditions: [What must be true before this scenario runs]
  Steps:
    1. [Exact action with specific selector/command/endpoint]
    2. [Next action with expected intermediate state]
    3. [Assertion with exact expected value]
  Expected Result: [Concrete, observable outcome]
  Failure Indicators: [What would indicate failure]
  Evidence: [Screenshot path / output capture / response body path]
```

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.

```
Wave 1 (Start Immediately):
├── Task 1: Create constants.ts module (no dependencies)
└── Task 4.1: Generate coverage baseline (no dependencies)

Wave 2 (After Wave 1):
├── Task 2: Performance fix with TDD (depends: constants.ts exists)
├── Task 5: Magic number refactoring (depends: constants.ts exists)
└── Task 3: Documentation updates (independent)

Wave 3 (After Wave 2):
├── Task 4.2: Add missing tests (depends: coverage baseline)
├── Task 4.3: Enforce CI coverage threshold (depends: tests added)
└── Task 6: TypeScript strict mode (depends: no other changes)

Critical Path: Task 1 → Task 2 → Task 4.2 → Task 4.3 → Task 6
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 5 | 4.1 |
| 2 | 1 | 4.2 | 5, 3 |
| 3 | None | None | 1, 4.1, 5 |
| 4.1 | None | 4.2 | 1, 3, 5 |
| 4.2 | 4.1 | 4.3 | 2, 5 |
| 4.3 | 4.2 | 6 | None |
| 4.4 | 4.3 | 6 | None |
| 5 | 1 | None | 2, 3 |
| 6 | None | None | 4.3, 4.4 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 4.1 | task(category="quick", load_skills=[], run_in_background=false) for constants; task(category="unspecified-low", load_skills=[], run_in_background=false) for coverage |
| 2 | 2, 5, 3 | dispatch parallel after Wave 1 completes |
| 3 | 4.2, 4.3, 4.4, 6 | final wave: tests and type checking |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [x] 1. Create Constants Module (prerequisite for other tasks)

  **What to do**:
  - [ ] RED: Write test for constants module existence and values
  - [ ] Create `packages/astro-gravatar/src/constants.ts`
  - [ ] Export all named constants (MIN_AVATAR_SIZE, MAX_AVATAR_SIZE, etc.)
  - [ ] GREEN: Verify constants match expected values
  - [ ] REFACTOR: Ensure consistent naming and documentation

  **Constants to extract** (from research findings):
  ```typescript
  export const MIN_AVATAR_SIZE = 1;
  export const MAX_AVATAR_SIZE = 2048;
  export const QR_MIN_SIZE = 1;
  export const QR_MAX_SIZE = 1000;
  export const DEFAULT_AVATAR_SIZE = 80;
  export const DEFAULT_QR_SIZE = 80;
  export const DEFAULT_TIMEOUT_MS = 10000;
  export const DEFAULT_CACHE_TTL_SECONDS = 300;
  export const DEFAULT_CACHE_MAX_SIZE = 100;
  export const DEFAULT_RETRY_MAX_ATTEMPTS = 3;
  export const DEFAULT_RETRY_BASE_DELAY_MS = 1000;
  export const DEFAULT_RETRY_MAX_DELAY_MS = 10000;
  export const DEFAULT_BACKOFF_FACTOR = 2;
  export const DEFAULT_SAFETY_BUFFER = 0.1;
  export const DEFAULT_RATE_LIMIT_MAX_CONCURRENT = 10;
  export const DEFAULT_CONCURRENCY = 10;
  export const RETRY_INTERVAL_MS = 50;
  export const CACHE_TTL_MS = 5 * 60 * 1000;
  export const USER_AGENT = 'astro-gravatar/1.0.0';
  ```

  **Must NOT do**:
  - Don't extract trivial constants like loop counters (i=0) that aren't meaningful
  - Don't over-abstract values that are only used once

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Straightforward file creation with no complex dependencies
  - **Skills**: None required for this simple task
  - **Skills Evaluated but Omitted**:
    - All skills are unnecessary for creating a constants file

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 4.1)
  - **Blocks**: Task 2, Task 5
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/gravatar.ts:30-40` - Current DEFAULT_AVATAR_SIZE, DEFAULT_TIMEOUT, DEFAULT_AVATAR_RATING patterns
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:145-161` - Current TTL, maxSize, retry defaults patterns
  - `packages/astro-gravatar/src/utils/hash.ts:130-132` - Current CACHE_TTL and CACHE_MAX_SIZE patterns

  **API/Type References** (contracts to implement against):
  - `packages/astro-gravatar/src/lib/types.ts` - Type definitions that may reference constants

  **Test References** (testing patterns to follow):
  - `packages/astro-gravatar/src/utils/__tests__/hash.test.ts` - Test structure for constants module

  **Documentation References** (specs and requirements):
  - `.sisyphus/drafts/codebase-improvements.md` - Draft containing magic number research findings

  **External References** (libraries and frameworks):
  - None required

  **WHY Each Reference Matters** (explain the relevance):
  - Don't just list files - explain what pattern/information the executor should extract
  - Bad: `src/lib/gravatar.ts` (vague, which constants?)
  - Good: `packages/astro-gravatar/src/lib/gravatar.ts:30-40` - Extract DEFAULT_AVATAR_SIZE=80, DEFAULT_TIMEOUT_MS=10000 patterns

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled)**:
  - [x] Test file created: packages/astro-gravatar/src/__tests__/constants.test.ts
  - [x] Test covers: All constants exported with correct values
  - [x] bun test packages/astro-gravatar/src/__tests__/constants.test.ts → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  > Write MULTIPLE named scenarios per task: happy path AND failure cases.
  > Each scenario = exact tool + steps with real selectors/data + evidence path.

  \`\`\`
  Scenario: Verify all constants are exported with correct values
    Tool: Bash (bun)
    Preconditions: constants.ts created, dependencies installed
    Steps:
      1. Create test file: cat > /tmp/constants-test.ts << 'EOF'
         import { MIN_AVATAR_SIZE, MAX_AVATAR_SIZE, DEFAULT_TIMEOUT_MS, USER_AGENT } from "../src/constants.ts";
         console.assert(MIN_AVATAR_SIZE === 1, "MIN_AVATAR_SIZE should be 1");
         console.assert(MAX_AVATAR_SIZE === 2048, "MAX_AVATAR_SIZE should be 2048");
         console.assert(DEFAULT_TIMEOUT_MS === 10000, "DEFAULT_TIMEOUT_MS should be 10000");
         console.assert(USER_AGENT === 'astro-gravatar/1.0.0', "USER_AGENT should match version");
         console.log("All constants verified");
         EOF
      2. Run: bun /tmp/constants-test.ts
      3. Assert: Output contains "All constants verified"
    Expected Result: All constants exported with correct types and values
    Evidence: Output captured

  Scenario: Constants module is importable from other modules
    Tool: Bash (bun)
    Preconditions: constants.ts created
    Steps:
      1. Create test import: cat > /tmp/test-import.ts << 'EOF'
         import * as Constants from "../packages/astro-gravatar/src/constants.ts";
         console.log("MIN_AVATAR_SIZE:", Constants.MIN_AVATAR_SIZE);
         console.log("Count:", Object.keys(Constants).length);
         EOF
      2. Run: bun /tmp/test-import.ts
      3. Assert: Output shows MIN_AVATAR_SIZE: 1 and Count >= 15
    Expected Result: Constants can be imported and used
    Evidence: Output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output for constants verification
  - [x] Import test output showing all constants

  **Commit**: YES
  - Message: `feat(constants): extract magic numbers to central constants module`
  - Files: `packages/astro-gravatar/src/constants.ts`, `packages/astro-gravatar/src/__tests__/constants.test.ts`
  - Pre-commit: `bun test packages/astro-gravatar/src/__tests__/constants.test.ts`

- [x] 1.1 Update gravatar.ts to use constants (part of constants extraction)
- [x] 1.2 Update hash.ts to use constants (part of constants extraction)
- [x] 1.3 Update GravatarClient.ts to use constants (part of constants extraction)

  **What to do**:
  - [ ] Import constants from src/constants.ts
  - [ ] Replace all magic numbers with constants:
    - ttl: 300 → DEFAULT_CACHE_TTL_SECONDS (lines 145-149)
    - maxSize: 100 → DEFAULT_CACHE_MAX_SIZE (lines 147-149)
    - maxAttempts: 3 → DEFAULT_RETRY_MAX_ATTEMPTS (line 151-152)
    - baseDelay: 1000 → DEFAULT_RETRY_BASE_DELAY_MS (line 152-153)
    - maxDelay: 10000 → DEFAULT_RETRY_MAX_DELAY_MS (line 153-156)
    - backoffFactor: 2 → DEFAULT_BACKOFF_FACTOR (line 154-155)
    - safetyBuffer: 0.1 → DEFAULT_SAFETY_BUFFER (line 159-160)
    - maxConcurrent: 10 → DEFAULT_RATE_LIMIT_MAX_CONCURRENT (line 160-161)
    - concurrency: 10 → DEFAULT_CONCURRENCY (line 268-269)
    - 50 ms jitter → RETRY_INTERVAL_MS (lines 292-295)

  **Must NOT do**:
  - Don't modify retry logic, only replace literals

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Multiple literal replacements with existing test coverage
  - **Skills**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 1.1, 1.2)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `packages/astro-gravatar/src/constants.ts` - Source of constants
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:145-161, 268-269, 292-295` - Lines with magic numbers to replace
  - `packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts` - Existing client tests

  **Acceptance Criteria**:
  - [x] bun test packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts → PASS
  - [x] grep -c "300\b" packages/astro-gravatar/src/lib/GravatarClient.ts shows 0 (all 300s replaced)
  - [x] grep -c "1000\b" packages/astro-gravatar/src/lib/GravatarClient.ts shows 0 (all 1000s replaced)
  - [x] grep -c "100\b" packages/astro-gravatar/src/lib/GravatarClient.ts shows 0 or minimal (cache size 100 is DEFAULT_CACHE_MAX_SIZE)

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: GravatarClient.ts uses all retry constants
    Tool: Bash (grep + bun test)
    Preconditions: GravatarClient.ts updated
    Steps:
      1. Verify DEFAULT_RETRY_MAX_ATTEMPTS used: grep "DEFAULT_RETRY_MAX_ATTEMPTS" packages/astro-gravatar/src/lib/GravatarClient.ts
      2. Verify DEFAULT_RETRY_BASE_DELAY_MS used: grep "DEFAULT_RETRY_BASE_DELAY_MS" packages/astro-gravatar/src/lib/GravatarClient.ts
      3. Verify DEFAULT_RETRY_MAX_DELAY_MS used: grep "DEFAULT_RETRY_MAX_DELAY_MS" packages/astro-gravatar/src/lib/GravatarClient.ts
      4. Run tests: bun test packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts
    Expected Result: Retry configuration uses constants, tests pass
    Evidence: Grep output and test results captured

  Scenario: GravatarClient.ts uses concurrency and safety constants
    Tool: Bash (grep + bun test)
    Preconditions: GravatarClient.ts updated
    Steps:
      1. Verify DEFAULT_RATE_LIMIT_MAX_CONCURRENT used: grep "DEFAULT_RATE_LIMIT_MAX_CONCURRENT" packages/astro-gravatar/src/lib/GravatarClient.ts
      2. Verify DEFAULT_SAFETY_BUFFER used: grep "DEFAULT_SAFETY_BUFFER" packages/astro-gravatar/src/lib/GravatarClient.ts
      3. Verify RETRY_INTERVAL_MS used for jitter: grep "RETRY_INTERVAL_MS" packages/astro-gravatar/src/lib/GravatarClient.ts
      4. Run tests: bun test packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts
    Expected Result: Concurrency and jitter use constants, tests pass
    Evidence: Grep output and test results captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Grep output showing all constants used
  - [x] Test run output showing all tests pass

  **Commit**: YES
  - Message: `refactor(client): replace magic numbers with constants`
  - Files: `packages/astro-gravatar/src/lib/GravatarClient.ts`
  - Pre-commit: `bun test packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts`

- [x] 2. Fix Performance: Hash Deduplication (TDD)

  **What to do**:
  - [ ] RED: Write spy test that fails before fix
    - Test that calling hashEmailWithCache(email) twice in parallel calls digest only once (not twice)
    - Use spyOn to track crypto.subtle.digest call count
  - [ ] Implement in-flight deduplication in hash.ts:
    - Add `inFlightHash = new Map<string, Promise<string>>()` module variable
    - Check inFlightHash before computing new hash
    - Store Promise for computation, delete after completion
  - [ ] GREEN: Spy test passes (digest called once)
  - [ ] REFACTOR: Ensure clean code, proper error handling

  **Must NOT do**:
  - Don't modify cache behavior, only add in-flight deduplication
  - Don't change hashEmailWithCache signature

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Performance optimization with TDD, focused on specific deduplication
  - **Skills**: None required for this change
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (must start after constants extraction)
  - **Blocks**: None
  - **Blocked By**: Task 1 (constants.ts needs to exist for consistency, though not strictly required)

  **References**:
  - `packages/astro-gravatar/src/utils/hash.ts:139-169` - hashEmailWithCache function to modify
  - `packages/astro-gravatar/src/utils/__tests__/hash.test.ts` - Existing hash tests for patterns
  - `packages/astro-gravatar/src/components/GravatarAvatar.astro:76-100` - Context of srcset generation causing the issue

  **Acceptance Criteria**:
  - [x] Test file created/updated: packages/astro-gravatar/src/utils/__tests__/hash.test.ts (or new dedup test file)
  - [x] Test covers: Parallel hashEmailWithCache calls trigger digest only once
  - [x] bun test packages/astro-gravatar/src/utils/__tests__/hash.test.ts → PASS (spy test passes)

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: Parallel hash requests deduplicate correctly
    Tool: Bash (bun)
    Preconditions: hash.ts with in-flight deduplication
    Steps:
      1. Create performance test: cat > /tmp/dedup-test.ts << 'EOF'
         import { hashEmailWithCache } from "../packages/astro-gravatar/src/utils/hash.ts";
         const email = "test@example.com";
         // Warm up cache
         await hashEmailWithCache(email);
         // Clear cache for fair test
         // Then test parallel calls
         const start = Date.now();
         await Promise.all([
           hashEmailWithCache(email),
           hashEmailWithCache(email),
           hashEmailWithCache(email)
         ]);
         const elapsed = Date.now() - start;
         console.log(`Dedup test completed in ${elapsed}ms`);
         console.log("PASS");
         EOF
      2. Run: bun /tmp/dedup-test.ts
      3. Assert: Output contains "PASS" and completes quickly (no multiple digests)
    Expected Result: Parallel calls share single digest result
    Evidence: Output captured with timing

  Scenario: Cached hashes return immediately (performance)
    Tool: Bash (bun)
    Preconditions: hash.ts with cache and deduplication
    Steps:
      1. Create cache test: cat > /tmp/cache-test.ts << 'EOF'
         import { hashEmailWithCache, clearEmailHashCache } from "../packages/astro-gravatar/src/utils/hash.ts";
         clearEmailHashCache();
         const email = "cache@example.com";
         const t1 = Date.now();
         const h1 = await hashEmailWithCache(email);
         const t2 = Date.now();
         const h2 = await hashEmailWithCache(email);
         const t3 = Date.now();
         console.assert(h1 === h2, "Cached hashes must match");
         console.assert(t2 - t1 > 50, "First call should compute hash");
         console.assert(t3 - t2 < 10, "Cached call should be instant");
         console.log("PASS");
         EOF
      2. Run: bun /tmp/cache-test.ts
    Expected Result: Cached result returns immediately
    Evidence: Output captured showing timing differences
  \`\`\`

  **Evidence to Capture**:
  - [x] Deduplication test output
  - [x] Cache performance test output

  **Commit**: YES
  - Message: `perf(hash): add in-flight deduplication for parallel hash requests`
  - Files: `packages/astro-gravatar/src/utils/hash.ts`, test file
  - Pre-commit: `bun test packages/astro-gravatar/src/utils/__tests__/hash.test.ts`

- [x] 3. Update Documentation for Error Codes

  **What to do**:
  - [ ] Update gravatar-llms.md Section 12.2: Add INVALID_EMAIL and INVALID_RESPONSE
  - [ ] Update components.md Error Codes section: Ensure codes match implementation
  - [ ] Update test-utils/README.md: Align INVALID_EMAILS with INVALID_EMAIL (or document difference)
  - [ ] Add "Error Handling" section to root README.md
  - [ ] Add "Error Handling" section to packages/astro-gravatar/README.md

  **Must NOT do**:
  - Don't modify code, only documentation
  - Don't create new error codes (only document existing ones)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation updates requiring clear, accurate writing
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/astro-gravatar/src/lib/types.ts` - Source of truth for error codes (INVALID_EMAIL, INVALID_RESPONSE already exist)
  - `gravatar-llms.md:Section 12.2` - Error codes table to update
  - `apps/astro-gravatar.and.guide/src/content/docs/reference/components.md:338-347` - Error Codes section to verify
  - `packages/astro-gravatar/test-utils/README.md:155-159` - INVALID_EMAILS to align

  **Acceptance Criteria**:
  - [x] grep "INVALID_EMAIL" gravatar-llms.md shows entry added
  - [x] grep "INVALID_RESPONSE" gravatar-llms.md shows entry added
  - [x] grep "Error handling" README.md shows section exists
  - [x] grep "Error handling" packages/astro-gravatar/README.md shows section exists

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: gravatar-llms.md documents error codes
    Tool: Bash (grep)
    Preconditions: Documentation updated
    Steps:
      1. Verify INVALID_EMAIL documented: grep -A 2 "INVALID_EMAIL" gravatar-llms.md | head -20
      2. Verify INVALID_RESPONSE documented: grep -A 2 "INVALID_RESPONSE" gravatar-llms.md | head -20
      3. Verify section in table: grep -B 5 "400.*INVALID_EMAIL" gravatar-llms.md
    Expected Result: Both error codes documented with HTTP status and description
    Evidence: Grep output captured

  Scenario: README files link to error handling docs
    Tool: Bash (grep)
    Preconditions: Both READMEs updated
    Steps:
      1. Verify root README has Error Handling: grep -i "error.*handling\|error.*codes" README.md | head -10
      2. Verify package README has Error Handling: grep -i "error.*handling\|error.*codes" packages/astro-gravatar/README.md | head -10
    Expected Result: Both READMEs reference error handling
    Evidence: Grep output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Grep output showing error codes in documentation
  - [x] Grep output showing README error handling sections

  **Commit**: YES
  - Message: `docs: add error handling documentation with INVALID_EMAIL and INVALID_RESPONSE`
  - Files: `gravatar-llms.md`, `README.md`, `packages/astro-gravatar/README.md`, `apps/astro-gravatar.and.guide/src/content/docs/reference/components.md`, `packages/astro-gravatar/test-utils/README.md`
  - Pre-commit: None (docs only, no tests to run)

- [x] 4.1 Generate Coverage Baseline (identify gaps)

  **What to do**:
  - [ ] Run `bun test --coverage` to generate coverage report
  - [ ] Parse coverage-summary.json or lcov report
  - [ ] Identify modules below 90% coverage
  - [ ] Document gaps: which files and what % coverage

  **Must NOT do**:
  - Don't write tests yet, only generate and analyze report

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Coverage report generation and analysis
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 4.2
  - **Blocked By**: None

  **References**:
  - `package.json` (root and packages/astro-gravatar) - Test scripts and coverage configuration
  - `.sisyphus/drafts/codebase-improvements.md` - Research findings listing test files

  **Acceptance Criteria**:
  - [x] `bun test --coverage` completes successfully
  - [x] Coverage report exists (coverage/coverage-summary.json or similar)
  - [x] Gaps documented in .sisyphus/notepads/coverage-gap-report.md (or inline summary)

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: Coverage report generated successfully
    Tool: Bash (bun test)
    Preconditions: Dependencies installed (bun install if needed)
    Steps:
      1. Run coverage: cd packages/astro-gravatar && bun test --coverage
      2. Verify report exists: ls -la coverage/ | head -20
      3. Parse overall coverage: grep "All files" coverage/coverage-summary.json || grep -E "statement.*%|branch.*%" coverage/coverage-summary.json | head -5
    Expected Result: Coverage report generated with overall percentage
    Evidence: Output captured showing coverage % and report files

  Scenario: Identify lowest coverage modules
    Tool: Bash (grep + awk)
    Preconditions: Coverage report exists
    Steps:
      1. Extract per-file coverage: cat coverage/coverage-summary.json | grep -v '"total"' | head -20
      2. Sort by coverage: (use jq or manual inspection)
      3. Identify files < 90%: grep -v -E "9[0-9]\.0%|100.0%" coverage/coverage-summary.json | head -10
    Expected Result: List of files below 90% coverage
    Evidence: Output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Coverage run output
  - [x] List of modules below 90%

  **Commit**: NO (informational task, no code changes)

- [x] 4.2 Add Tests for Low-Coverage Modules (TDD)

  **What to do**:
  - [ ] RED: For each module below 90%, write failing tests first
  - [ ] GREEN: Implement code/tests to increase coverage above 90%
  - [ ] REFACTOR: Clean up test code while keeping coverage
  - [ ] Target modules likely needing tests (from research):
    - GravatarAvatar component variations
    - GravatarProfileCard component variations
    - GravatarQR component edge cases
    - Any remaining lib/modules not covered

  **Must NOT do**:
  - Don't add meaningless tests just to hit coverage
  - Don't modify production code unnecessarily

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Test writing to achieve specific coverage targets
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES (multiple modules can be tested in parallel)
  - **Parallel Group**: Wave 3 (with Tasks 4.3, 4.4)
  - **Blocks**: Task 4.3
  - **Blocked By**: Task 4.1

  **References**:
  - Coverage report from Task 4.1 - Identifies which modules need tests
  - Existing test files in `packages/astro-gravatar/src/**/__tests__/` - Patterns to follow
  - `packages/astro-gravatar/src/utils/__tests__/hash.test.ts` - Example of comprehensive test coverage

  **Acceptance Criteria**:
  - [x] `bun test --coverage` reports >90% overall coverage
  - [x] All previously low-coverage modules now >90%
  - [x] Total test count increases or stays same

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: Overall coverage >90%
    Tool: Bash (bun test)
    Preconditions: New tests added
    Steps:
      1. Run coverage: cd packages/astro-gravatar && bun test --coverage
      2. Extract overall %: grep "All files" coverage/coverage-summary.json || grep -E "statement.*%" coverage/coverage-summary.json
      3. Parse: extract percentage (e.g., "statements": 91.5)
      4. Assert: Percentage > 90
    Expected Result: Coverage report shows >90% coverage
    Evidence: Output captured showing percentage

  Scenario: Low-coverage modules now above 90%
    Tool: Bash (bun test + grep)
    Preconditions: Coverage report regenerated
    Steps:
      1. Get specific module coverage: cat coverage/coverage-summary.json | grep "GravatarAvatar.ts"
      2. Extract percentage: (use jq or regex)
      3. Assert: Coverage > 90
      4. Repeat for GravatarProfileCard.ts, GravatarQR.ts (identified as low-coverage)
    Expected Result: Previously low modules now >90%
    Evidence: Output captured for each module
  \`\`\`

  **Evidence to Capture**:
  - [x] Coverage report showing >90% overall
  - [x] Per-module coverage output showing improvements

  **Commit**: YES (after sufficient tests added)
  - Message: `test: add tests to achieve >90% coverage target`
  - Files: Multiple test files (depends on gaps found)
  - Pre-commit: `bun test --coverage`

- [x] 4.3 Enforce CI Coverage Threshold (>90%)

  **What to do**:
  - [ ] Add coverageThreshold to bun test configuration or package.json
  - [ ] Set global threshold to 90% (statements, branches, functions, lines)
  - [ ] Set per-module thresholds if needed (critical modules)
  - [ ] Test that threshold enforcement works (run coverage with failing threshold)

  **Must NOT do**:
  - Don't set threshold higher than 90% (would be too aggressive)
  - Don't forget to commit threshold configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple configuration change for CI enforcement
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after tests added)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4.2

  **References**:
  - `packages/astro-gravatar/package.json` - Test scripts section for coverage configuration
  - Bun test documentation for coverageThreshold syntax
  - `.sisyphus/drafts/codebase-improvements.md` - User confirmed 90% target with CI enforcement

  **Acceptance Criteria**:
  - [x] package.json or test config contains coverageThreshold
  - [x] coverageThreshold.global set to >= 90
  - [x] Test that coverage below threshold fails: Modify a test to temporarily reduce coverage, run bun test --coverage, verify failure

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: Coverage threshold enforced in CI
    Tool: Bash (bun test)
    Preconditions: coverageThreshold configured
    Steps:
      1. Verify configuration: grep -A 5 "coverageThreshold" packages/astro-gravatar/package.json || grep -A 5 "coverageThreshold" bun.config.ts
      2. Run coverage: cd packages/astro-gravatar && bun test --coverage
      3. Verify threshold check in output: grep -i "threshold\|90%" coverage/coverage-summary.json || bun test output
    Expected Result: Coverage report includes threshold information
    Evidence: Output captured

  Scenario: Coverage below threshold fails
    Tool: Bash (bun test)
    Preconditions: coverageThreshold configured
    Steps:
      1. Temporarily comment out a test to reduce coverage (simulating regression)
      2. Run coverage: cd packages/astro-gravatar && bun test --coverage
      3. Verify failure: grep -i "fail\|below.*threshold\|threshold.*not.*met" bun test output || echo "Should fail"
      4. Restore test
    Expected Result: Build fails when coverage below 90%
    Evidence: Output captured showing failure
  \`\`\`

  **Evidence to Capture**:
  - [x] Configuration output showing coverageThreshold
  - [x] Test failure output when threshold not met

  **Commit**: YES
  - Message: `test(ci): enforce >90% coverage threshold`
  - Files: `packages/astro-gravatar/package.json` or `bun.config.ts`
  - Pre-commit: `bun test --coverage`

- [x] 4.4 Update README with Current Coverage Stats

  **What to do**:
  - [ ] Update README.md coverage mention from 78.44% to actual (>90%)
  - [ ] Update packages/astro-gravatar/README.md coverage mention
  - [ ] Document test count increase (from 299 to new count)

  **Must NOT do**:
  - Don't modify code, only documentation

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation update reflecting new coverage baseline
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 4.3)
  - **Blocks**: None
  - **Blocked By**: Task 4.3

  **References**:
  - `README.md` - Root README with coverage stats
  - `packages/astro-gravatar/README.md` - Package README with coverage stats
  - Coverage report from Task 4.3 - Source of new coverage percentage

  **Acceptance Criteria**:
  - [x] grep -E "78\.44%" README.md returns 0 (old stat removed)
  - [x] grep ">90%" README.md shows new stat
  - [x] grep ">90%" packages/astro-gravatar/README.md shows new stat

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: README reflects >90% coverage
    Tool: Bash (grep)
    Preconditions: READMEs updated
    Steps:
      1. Verify old stat removed: grep "78.44%" README.md | wc -l
      2. Assert: Grep result is 0 (old stat gone)
      3. Verify new stat: grep -E ">90%|90\+\." README.md | head -5
    Expected Result: README shows updated coverage statistics
    Evidence: Grep output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Grep output showing updated coverage stats

  **Commit**: YES
  - Message: `docs: update README coverage stats to >90%`
  - Files: `README.md`, `packages/astro-gravatar/README.md`
  - Pre-commit: None

- [x] 5. Re-enable TypeScript Strict Flags (aggressive)

  **What to do**:
  - [ ] Enable noUnusedLocals: true in tsconfig.json
  - [ ] Enable noUnusedParameters: true in tsconfig.json
  - [ ] Enable noPropertyAccessFromIndexSignature: true in tsconfig.json
  - [ ] Run `bun tsc --noEmit` to identify errors
  - [ ] Fix all TypeScript errors from strict flags:
    - Remove unused locals
    - Remove unused parameters (or prefix with _)
    - Fix index signature access issues
  - [ ] Verify no TypeScript errors remain

  **Must NOT do**:
  - Don't skip fixing errors (must fix all to enable flags)
  - Don't use @ts-ignore or @ts-expect-error as workarounds

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: TypeScript strict mode enablement with error fixes required
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after other changes complete)
  - **Blocks**: None
  - **Blocked By**: None (independent of other tasks)

  **References**:
  - `tsconfig.json` (root) - File with disabled flags
  - `packages/astro-gravatar/tsconfig.json` - Package tsconfig extending astro/tsconfigs/strict
  - `apps/astro-gravatar.and.guide/tsconfig.json` - App tsconfig
  - `.sisyphus/drafts/codebase-improvements.md` - Research findings showing disabled flags

  **Acceptance Criteria**:
  - [x] grep '"noUnusedLocals": true' tsconfig.json shows flag enabled
  - [x] grep '"noUnusedParameters": true' tsconfig.json shows flag enabled
  - [x] grep '"noPropertyAccessFromIndexSignature": true' tsconfig.json shows flag enabled
  - [x] `bun tsc --noEmit` completes with exit code 0

  **Agent-Executed QA Scenarios (MANDATORY)**:
  \`\`\`
  Scenario: All strict flags enabled in tsconfig.json
    Tool: Bash (grep)
    Preconditions: tsconfig.json updated
    Steps:
      1. Verify noUnusedLocals: grep '"noUnusedLocals": true' tsconfig.json
      2. Verify noUnusedParameters: grep '"noUnusedParameters": true' tsconfig.json
      3. Verify noPropertyAccessFromIndexSignature: grep '"noPropertyAccessFromIndexSignature": true' tsconfig.json
    Expected Result: All three flags enabled
    Evidence: Grep output captured

  Scenario: TypeScript compilation succeeds with no errors
    Tool: Bash (bun tsc)
    Preconditions: Strict flags enabled, all errors fixed
    Steps:
      1. Run type check: bun tsc --noEmit
      2. Check exit code: echo $? (last command status)
      3. Assert: Exit code is 0
      4. Check for errors: bun tsc --noEmit 2>&1 | grep -i "error" || echo "No errors"
    Expected Result: TypeScript compiles with no errors
    Evidence: Output captured showing clean compilation
  \`\`\`

  **Evidence to Capture**:
  - [x] Grep output showing all flags enabled
  - [x] TypeScript compilation output showing no errors

  **Commit**: YES (after all errors fixed)
  - Message: `refactor(typescript): enable all strict flags (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)`
  - Files: `tsconfig.json`, plus any source files with fixes
  - Pre-commit: `bun tsc --noEmit`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(constants): extract magic numbers to central constants module` | constants.ts, constants.test.ts | `bun test constants.test.ts` |
| 1.1 | `refactor(gravatar): replace magic numbers with constants` | src/lib/gravatar.ts | `bun test gravatar.test.ts` |
| 1.2 | `refactor(hash): replace magic numbers with constants` | src/utils/hash.ts | `bun test hash.test.ts` |
| 1.3 | `refactor(client): replace magic numbers with constants` | src/lib/GravatarClient.ts | `bun test GravatarClient.test.ts` |
| 2 | `perf(hash): add in-flight deduplication for parallel hash requests` | src/utils/hash.ts, tests | `bun test hash.test.ts` |
| 3 | `docs: add error handling documentation with INVALID_EMAIL and INVALID_RESPONSE` | Various .md files | None (docs only) |
| 4.2 | `test: add tests to achieve >90% coverage target` | Multiple test files | `bun test --coverage` |
| 4.3 | `test(ci): enforce >90% coverage threshold` | package.json or bun.config.ts | `bun test --coverage` |
| 4.4 | `docs: update README coverage stats to >90%` | README.md, packages/astro-gravatar/README.md | None |
| 5 | `refactor(typescript): enable all strict flags (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)` | tsconfig.json, source fixes | `bun tsc --noEmit` |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass
bun test

# Test coverage >90%
bun test --coverage && grep -E "statements.*[9][0-9]\.[0-9]%|statements.*100.0%" coverage/coverage-summary.json

# TypeScript compiles with no errors
bun tsc --noEmit

# No magic numbers in core files
grep -c "300\b" packages/astro-gravatar/src/lib/gravatar.ts && grep -c "300\b" packages/astro-gravatar/src/lib/GravatarClient.ts && grep -c "5 \* 60 \* 1000" packages/astro-gravatar/src/utils/hash.ts
# (Should all return 0 or show constants usage instead)

# Documentation updated
grep "INVALID_EMAIL" gravatar-llms.md && grep "INVALID_RESPONSE" gravatar-llms.md && grep "Error handling" README.md && grep "Error handling" packages/astro-gravatar/README.md
```

### Final Checklist
- [x] All 5 improvement areas completed
- [x] Test coverage >90% (verified via coverage report)
- [x] All TypeScript strict flags enabled (noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature)
- [x] `bun tsc --noEmit` completes with no errors
- [x] All magic numbers extracted to constants.ts (verified via grep)
- [x] Documentation updated for error codes (INVALID_EMAIL, INVALID_RESPONSE)
- [x] All 299+ tests still passing (no regressions)
- [x] CI coverage threshold configured (90%+)
- [x] Hash deduplication working (spy test proves single digest for parallel calls)
