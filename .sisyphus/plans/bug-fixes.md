# Bug Fixes for astro-gravatar

## TL;DR

> **Quick Summary**: Fix 7 high-priority bugs in astro-gravatar including error code misuse, duplicate validation, URL encoding, email mapping, TTL calculation, cache eviction, and size validation.
>
> **Deliverables**:
> - Fixed error codes in validation (use `INVALID_RESPONSE`)
> - Extracted shared email validation utility
> - Fixed double URL encoding for custom default avatars
> - Fixed `getProfiles` email mapping bug
> - Fixed TTL unit confusion in rate limit handling
> - Fixed cache eviction off-by-one error
> - Added explicit validation for size=0
>
> **Estimated Effort**: Short (~30-45 min)
> **Parallel Execution**: NO - sequential
> **Critical Path**: Fix error codes → Extract validation → Fix encoding → Fix mapping → Fix TTL → Fix cache → Fix size validation → Update tests

---

## Context

### Original Request
User requested: "개선사항 검토좀" (Review improvements)

### Interview Summary
**Key Discussions**:
- User chose: **"버그 수정만 (높은 우선순위)"** - Fix only high-priority bugs
- Error code handling decision: Use existing `INVALID_RESPONSE` code instead of creating new code (to maintain backward compatibility as much as possible, though this still changes behavior)

**Research Findings**:
- Project uses Bun for runtime and testing
- Test coverage: 78.44% (315 tests)
- TypeScript strict mode enabled
- Uses `crypto.subtle` for SHA256 hashing (Bun-compatible)

### Metis Review
**Identified Gaps** (addressed):
- **Bug 1 Warning**: Error code changes could be breaking change for existing consumers. Decision: Use `INVALID_RESPONSE` (existing code) instead of creating new code
- **Acceptance Criteria**: Each bug fix needs specific test cases to verify the fix

---

## Work Objectives

### Core Objective
Fix 7 high-priority bugs that affect functionality, data correctness, and reliability.

### Concrete Deliverables
- Modified `gravatar.ts` (error codes, URL encoding, TTL, size validation)
- Modified `GravatarClient.ts` (email mapping, cache eviction)
- Created `src/utils/validation.ts` (shared email validation)
- Updated `GravatarQR.astro` (use shared validation)
- Added/Updated test files for all fixes

### Definition of Done
- [x] All 7 bugs fixed with working code
- [x] `bun test` passes with all tests
- [x] No TypeScript errors (`bun typecheck`)
- [x] Each fix has corresponding test coverage

### Must Have
- Fix all 7 identified bugs
- Maintain backward compatibility where possible
- Add tests for each fix
- No new bugs introduced

### Must NOT Have (Guardrails)
- **DO NOT modify email regex logic itself** - only extract to shared utility
- **DO NOT refactor entire `getProfiles` method** - fix only the index mapping bug
- **DO NOT change cache data structure** - fix only the eviction math
- **DO NOT create new error codes** - reuse `INVALID_RESPONSE`
- **DO NOT change library public API** - internal fixes only

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after (fixes first, then verify with tests)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

---

## Execution Strategy

### Parallel Execution Waves

This is a sequential task list with dependencies:
```
Wave 1 (Start Immediately):
├── Task 1: Fix error codes in gravatar.ts
└── Task 2: Extract shared email validation

Wave 2 (After Wave 1):
├── Task 3: Fix double URL encoding
├── Task 4: Fix getProfiles email mapping

Wave 3 (After Wave 2):
├── Task 5: Fix TTL unit confusion
├── Task 6: Fix cache eviction

Wave 4 (After Wave 3):
└── Task 7: Fix size=0 validation
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 5, 7 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1 | - | 4 |
| 4 | None | - | 3 |
| 5 | None | - | 6 |
| 6 | None | - | 5, 7 |
| 7 | None | - | 6 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2 | task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 3, 4 | task(category="quick", load_skills=[], run_in_background=false) |
| 3 | 5, 6 | task(category="quick", load_skills=[], run_in_background=false) |
| 4 | 7 | task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

- [x] 1. Fix Error Code Misuse in gravatar.ts

  **What to do**:
  - Change error code from `GRAVATAR_ERROR_CODES.INVALID_EMAIL` to `GRAVATAR_ERROR_CODES.INVALID_RESPONSE` in:
    - `buildAvatarUrl()` line ~77 (size validation)
    - `buildQRCodeUrl()` line ~145 (QR size validation)
  - Do NOT create new error codes

  **Must NOT do**:
  - Do not create `INVALID_ARGUMENT` or other new error codes
  - Do not modify error handling logic, only the error code constant

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple string constant replacement in existing code
  - **Skills**: `[]`
    - No special skills needed - basic code editing

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 1 (with Task 2) | Sequential
  - **Blocks**: Tasks 3, 5, 7
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/gravatar.ts:75-78` - buildAvatarUrl size validation error pattern
  - `packages/astro-gravatar/src/lib/gravatar.ts:143-146` - buildQRCodeUrl size validation error pattern
  - `packages/astro-gravatar/src/lib/types.ts:342-352` - GRAVATAR_ERROR_CODES definitions

  **API/Type References** (contracts to implement against):
  - `packages/astro-gravatar/src/lib/types.ts:325-339` - GravatarError class definition

  **Test References** (testing patterns to follow):
  - `packages/astro-gravatar/src/lib/__tests__/gravatar.test.ts:105-125` - Error code testing patterns

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Line 75-78 in gravatar.ts shows exactly where INVALID_EMAIL is used incorrectly - replace with INVALID_RESPONSE
  - Line 143-146 in gravatar.ts shows second incorrect usage - same replacement needed
  - Types.ts GRAVATAR_ERROR_CODES confirms INVALID_RESPONSE exists and is appropriate for validation failures

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] Test added: verify size validation throws INVALID_RESPONSE
  - [x] Test added: verify QR size validation throws INVALID_RESPONSE
  - [x] bun test src/lib/__tests__/gravatar.test.ts → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: buildAvatarUrl throws INVALID_RESPONSE for invalid size
    Tool: Bash (bun test)
    Preconditions: None
    Steps:
      1. bun test src/lib/__tests__/gravatar.test.ts
      2. Verify test that checks size validation error code passes
    Expected Result: Test passes, error code is INVALID_RESPONSE not INVALID_EMAIL
    Evidence: Test output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing passing tests
  - [x] grep output confirming INVALID_RESPONSE in gravatar.ts (not INVALID_EMAIL for validation)

  **Commit**: NO (groups with 2, 3, 4)
  - Message: `type(scope): desc`
  - Files: `packages/astro-gravatar/src/lib/gravatar.ts`
  - Pre-commit: `bun test`

- [x] 1.1 Fix Error Code Misuse in GravatarQR.astro

  **What to do**:
  - Change error code from `GRAVATAR_ERROR_CODES.INVALID_EMAIL` to `GRAVATAR_ERROR_CODES.INVALID_RESPONSE` in `packages/astro-gravatar/src/components/GravatarQR.astro`:
    - Size validation (line ~77)
    - Version validation (line ~85)
    - Type validation (line ~93)

  **Must NOT do**:
  - Do not change email validation (line ~69), that should remain INVALID_EMAIL

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `packages/astro-gravatar/src/components/GravatarQR.astro`

  **Acceptance Criteria**:
  - [x] grep "INVALID_EMAIL" packages/astro-gravatar/src/components/GravatarQR.astro shows only 1 match (for email validation)
  - [x] grep "INVALID_RESPONSE" packages/astro-gravatar/src/components/GravatarQR.astro shows 3 matches (size, version, type)

  **Commit**: YES
  - Message: `fix(components): use correct error code INVALID_RESPONSE for GravatarQR validation`
  - Files: `packages/astro-gravatar/src/components/GravatarQR.astro`


---

- [x] 2. Extract Shared Email Validation Utility

  **What to do**:
  - Create new file: `packages/astro-gravatar/src/utils/validation.ts`
  - Move EMAIL_REGEX and isValidEmail from `hash.ts` to new file
  - Export from both locations: `export { isValidEmail } from './validation.js'`
  - Update `GravatarQR.astro` to import from `validation.ts` instead of defining inline regex

  **Must NOT do**:
  - Do NOT modify the regex pattern itself (guardrails from Metis)
  - Do NOT modify validation logic, only move it

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: File creation and code extraction - straightforward refactoring
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 1 (with Task 1) | Sequential
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/utils/hash.ts:12` - EMAIL_REGEX definition
  - `packages/astro-gravatar/src/utils/hash.ts:19-21` - isValidEmail function
  - `packages/astro-gravatar/src/components/GravatarQR.astro:65-71` - Duplicate inline validation

  **API/Type References** (contracts to implement against):
  - None - new utility file

  **Test References** (testing patterns to follow):
  - `packages/astro-gravatar/src/utils/__tests__/hash.test.ts:25-40` - Email validation test patterns

  **Documentation References** (specs and requirements):
  - None - internal refactoring

  **WHY Each Reference Matters** (explain the relevance):
  - hash.ts line 12 is the EMAIL_REGEX to extract - copy this exactly
  - hash.ts line 19-21 shows isValidEmail implementation - export this
  - GravatarQR.astro line 65-71 is the duplicate to replace - import from validation.ts instead

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] File created: src/utils/validation.ts
  - [x] hash.ts exports isValidEmail from validation.ts
  - [x] GravatarQR.astro imports from validation.ts
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: Verify EMAIL_REGEX appears only in validation.ts
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. grep -r "EMAIL_REGEX" packages/astro-gravatar/src/
      2. Verify only validation.ts contains the definition
    Expected Result: Single match in validation.ts, no duplicates
    Evidence: Grep output captured
  \`\`\`

  \`\`\`
  Scenario: GravatarQR.astro uses shared validation
    Tool: Bash (grep)
    Preconditions: refactoring complete
    Steps:
      1. grep "isValidEmail" packages/astro-gravatar/src/components/GravatarQR.astro
      2. Verify it imports from validation.ts
    Expected Result: Import statement present, no inline regex
    Evidence: Grep output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Grep output showing single EMAIL_REGEX location
  - [x] Test output passing all tests

  **Commit**: NO (groups with 1)
  - Message: `refactor(utils): extract shared email validation to validation.ts`
  - Files: `packages/astro-gravatar/src/utils/validation.ts`, `packages/astro-gravatar/src/utils/hash.ts`, `packages/astro-gravatar/src/components/GravatarQR.astro`
  - Pre-commit: `bun test`

---

- [x] 3. Fix Double URL Encoding in buildAvatarUrl

  **What to do**:
  - Remove `encodeURIComponent()` from line ~95 in `gravatar.ts`
  - URLSearchParams already encodes values, so double-encoding breaks URLs
  - Change from: `params.set('d', encodeURIComponent(options.default));`
  - To: `params.set('d', options.default);`

  **Must NOT do**:
  - Do NOT modify other parts of buildAvatarUrl
  - Do NOT change any other URL construction

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Single line fix - remove unnecessary encoding call
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 2 (with Task 4) | Sequential
  - **Blocks**: None (but depends on Task 1 for error codes)
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/gravatar.ts:89-95` - buildAvatarUrl default parameter handling
  - `packages/astro-gravatar/src/lib/__tests__/gravatar.test.ts:68-76` - Test showing double-encoding expectation

  **API/Type References** (contracts to implement against):
  - None - internal fix

  **Test References** (testing patterns to follow):
  - `packages/astro-gravatar/src/lib/__tests__/gravatar.test.ts:68-76` - Custom default URL test

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Line 89-95 shows the exact location of encodeURIComponent to remove
  - Test line 68-76 confirms double-encoding is currently expected (will need test update too)

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] encodeURIComponent removed from gravatar.ts line 95
  - [x] Test updated to expect single encoding
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: Custom default avatar URL is encoded once only
    Tool: Bash (bun test)
    Preconditions: Fix applied, test updated
    Steps:
      1. bun test src/lib/__tests__/gravatar.test.ts
      2. Verify custom URL test passes with single encoding
    Expected Result: URL contains %253A (not %25253A)
    Evidence: Test output captured
  \`\`\`

  \`\`\`
  Scenario: Verify no double encoding in buildAvatarUrl
    Tool: Bash (grep)
    Preconditions: Fix applied
    Steps:
      1. grep -n "encodeURIComponent" packages/astro-gravatar/src/lib/gravatar.ts
      2. Verify no matches in buildAvatarUrl function
    Expected Result: No results or matches in unrelated code only
    Evidence: Grep output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing single-encoding test passes
  - [x] Grep output confirming no encodeURIComponent in buildAvatarUrl

  **Commit**: NO (groups with 4)
  - Message: `fix(api): remove double URL encoding for custom default avatars`
  - Files: `packages/astro-gravatar/src/lib/gravatar.ts`, `packages/astro-gravatar/src/lib/__tests__/gravatar.test.ts`
  - Pre-commit: `bun test`

---

- [x] 4. Fix getProfiles Email Mapping Bug in GravatarClient.ts

  **What to do**:
  - Fix line ~326 in `getProfiles()` method
  - Change from: `const email = batch[emailIndex] || 'unknown';`
  - To: `const email = batch[index] || 'unknown';`
  - Use the Promise.allSettled result index, not results.length

  **Must NOT do**:
  - Do NOT refactor the entire getProfiles method (guardrails)
  - Do NOT change any other batching logic
  - Do NOT modify error handling structure

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Variable name fix - minimal change
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 2 (with Task 3) | Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:318-338` - getProfiles batch result handling
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:280-314` - Batch iteration and Promise.allSettled usage

  **API/Type References** (contracts to implement against):
  - None - internal fix

  **Test References** (testing patterns to follow):
  - No specific test for this bug exists - add test for batch failure mapping

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Lines 318-338 show the forEach loop where emailIndex is incorrectly calculated
  - Lines 280-314 show batchPromises.map is where index comes from - use that index

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] Line 326 uses batch[index] instead of results.length
  - [x] Test added: verify failed profiles map to correct emails
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: getProfiles correctly maps failures to emails
    Tool: Bun test
    Preconditions: Test added
    Steps:
      1. bun test src/lib/__tests__/GravatarClient.test.ts
      2. Verify batch failure test passes
    Expected Result: Error object contains correct email from input array
    Evidence: Test output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing batch mapping test passes
  - [x] Source code diff showing batch[index] used

  **Commit**: NO (groups with 3)
  - Message: `fix(client): correct email mapping in getProfiles batch failures`
  - Files: `packages/astro-gravatar/src/lib/GravatarClient.ts`
  - Pre-commit: `bun test`

---

- [x] 5. Fix TTL Unit Confusion in Rate Limit Handling

  **What to do**:
  - Fix line ~277 in `gravatar.ts` in `makeRequest()` function
  - Current: `const ttl = Math.min(300, rateLimit.reset - Date.now()) * 1000;`
  - Issue: `rateLimit.reset` is seconds, `Date.now()` is milliseconds
  - Fix to: `const ttl = Math.min(300, rateLimit.reset * 1000 - Date.now());`
  - Convert rateLimit.reset to milliseconds before subtraction

  **Must NOT do**:
  - Do NOT modify any other TTL or caching logic
  - Do NOT change rate limit parsing

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Time unit conversion fix - straightforward math
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 3 (with Task 6) | Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/gravatar.ts:276-279` - TTL calculation in makeRequest
  - `packages/astro-gravatar/src/lib/gravatar.ts:188-201` - parseRateLimitHeaders function

  **API/Type References** (contracts to implement against):
  - `packages/astro-gravatar/src/lib/types.ts:282-290` - RateLimitInfo interface definition

  **Test References** (testing patterns to follow):
  - No specific TTL unit test exists - add test to verify positive TTL values

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Line 276-279 shows exact calculation to fix - reset needs *1000 before subtraction
  - parseRateLimitHeaders confirms reset is seconds (Unix timestamp)

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] Line 277 multiplies reset by 1000 before subtraction
  - [x] Test added: verify TTL is always positive and reasonable
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: TTL calculation produces positive values
    Tool: Bun test
    Preconditions: Test added with mocked rate limit
    Steps:
      1. bun test src/lib/__tests__/gravatar.test.ts
      2. Verify TTL test passes (no negative values)
    Expected Result: TTL is reasonable (e.g., ~60s, not negative)
    Evidence: Test output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing TTL calculation test passes
  - [x] Source code showing rateLimit.reset * 1000 - Date.now()

  **Commit**: NO (groups with 6)
  - Message: `fix(api): convert rate limit reset to milliseconds before TTL calculation`
  - Files: `packages/astro-gravatar/src/lib/gravatar.ts`
  - Pre-commit: `bun test`

---

- [x] 6. Fix Cache Eviction Logic

  **What to do**:
  - **Part A**: Fix line ~811 in `evictOldestEntries()` method in `GravatarClient.ts`
    - Change from: `const toRemove = entries.length - maxSize + 1;`
    - To: `const toRemove = entries.length - maxSize;`
    - Remove `+ 1` that causes under-eviction (leaving less than maxSize after removal)
  - **Part B**: Remove redundant "Prune if too large" logic from `setCache()`
    - Remove line ~785 comment and unnecessary evict call
    - `setCache()` only needs to add new entry, eviction is handled when size > maxSize

  **Must NOT do**:
  - Do NOT modify any other cache logic
  - Do NOT change cache data structure

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Simple math fix - remove one character
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 3 (with Task 5) | Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:803-815` - evictOldestEntries implementation
  - `packages/astro-gravatar/src/lib/GravatarClient.ts:784-798` - setCache calling evictOldestEntries

  **API/Type References** (contracts to implement against):
  - None - internal fix

  **Test References** (testing patterns to follow):
  - No cache eviction test exists - add test to verify cache size never exceeds maxSize

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Line 803-815 shows exact location of toRemove calculation - remove +1
  - setCache shows how eviction is triggered - need to fix not to over-evict

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] Line 811 uses entries.length - maxSize (no +1)
  - [x] Test added: verify cache never exceeds maxSize
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: Cache eviction does not exceed maxSize
    Tool: Bun test
    Preconditions: Test added
    Steps:
      1. bun test src/lib/__tests__/GravatarClient.test.ts
      2. Verify cache size test passes
    Expected Result: Cache size equals maxSize after eviction
    Evidence: Test output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing cache size never exceeds maxSize
  - [x] Source code diff showing +1 removed

  **Commit**: NO (groups with 5)
  - Message: `fix(client): remove off-by-one from cache eviction calculation`
  - Files: `packages/astro-gravatar/src/lib/GravatarClient.ts`
  - Pre-commit: `bun test`

---

- [x] 7. Fix Size Validation for size=0

  **What to do**:
  - Fix validation checks in two places:
    - `buildAvatarUrl()` line ~73: Change `if (options.size && ...)` to `if (options.size !== undefined && ...)`
    - `buildQRCodeUrl()` line ~141: Change `if (options.size && ...)` to `if (options.size !== undefined && ...)`
  - This ensures size=0 is properly validated (0 is falsy but invalid)

  **Must NOT do**:
  - Do NOT modify validation logic itself, only the condition check
  - Do NOT change any other parameters

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Conditional check fix - simple change
  - **Skills**: `[]`
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 4 (final) | Sequential
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `packages/astro-gravatar/src/lib/gravatar.ts:72-81` - buildAvatarUrl size validation
  - `packages/astro-gravatar/src/lib/gravatar.ts:140-148` - buildQRCodeUrl size validation

  **API/Type References** (contracts to implement against):
  - None - internal fix

  **Test References** (testing patterns to follow):
  - `packages/astro-gravatar/src/lib/__tests__/gravatar.test.ts:85-95` - Size validation test patterns

  **Documentation References** (specs and requirements):
  - None - internal bug fix

  **WHY Each Reference Matters** (explain the relevance):
  - Lines 72-81 show buildAvatarUrl size check - change truthy to !== undefined
  - Lines 140-148 show buildQRCodeUrl size check - same change needed

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **If TDD (tests enabled):**
  - [x] buildAvatarUrl uses !== undefined check
  - [x] buildQRCodeUrl uses !== undefined check
  - [x] Test added: verify size=0 throws validation error
  - [x] bun test → PASS

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: size=0 triggers validation error
    Tool: Bun test
    Preconditions: Test added
    Steps:
      1. bun test src/lib/__tests__/gravatar.test.ts
      2. Verify size=0 test passes
    Expected Result: Validation error thrown for size=0
    Evidence: Test output captured
  \`\`\`

  **Evidence to Capture**:
  - [x] Test output showing size=0 validation works
  - [x] Source code showing !== undefined checks

  **Commit**: YES (final commit for all bug fixes)
  - Message: `fix(validation): catch size=0 in avatar/QR validation checks`
  - Files: `packages/astro-gravatar/src/lib/gravatar.ts`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1, 2 | `fix(validation): use INVALID_RESPONSE for size/Q validation errors; refactor utils: extract shared email validation` | gravatar.ts, hash.ts, validation.ts, GravatarQR.astro | bun test |
| 3, 4 | `fix(api): remove double encoding; fix(client): correct getProfiles email mapping` | gravatar.ts, gravatar.test.ts, GravatarClient.ts | bun test |
| 5, 6 | `fix(api): fix TTL unit conversion; fix(client): correct cache eviction` | gravatar.ts, GravatarClient.ts | bun test |
| 7 | `fix(validation): catch size=0 in validation` | gravatar.ts | bun test |

---

## Success Criteria

### Verification Commands
```bash
cd packages/astro-gravatar
bun test                    # All tests pass
bun typecheck               # No TypeScript errors
grep -r "INVALID_EMAIL.*size\|INVALID_EMAIL.*qr" src/lib/  # Confirm no size/QR errors use INVALID_EMAIL
grep -r "EMAIL_REGEX.*const\|EMAIL_REGEX.*=" src/  # Confirm EMAIL_REGEX only in validation.ts
grep -r "encodeURIComponent.*default" src/lib/gravatar.ts  # Confirm no double encoding
grep "entries.length - maxSize + 1" src/lib/GravatarClient.ts  # Confirm no +1
```

### Final Checklist
- [x] All 7 bugs fixed
- [x] `bun test` passes (all 315+ tests)
- [x] `bun typecheck` passes (no TypeScript errors)
- [x] EMAIL_REGEX appears only in validation.ts
- [x] No size/QR validation uses INVALID_EMAIL
- [x] No double URL encoding in buildAvatarUrl
- [x] getProfiles uses batch[index] for email mapping
- [x] TTL calculation converts reset to milliseconds
- [x] Cache eviction has no +1
- [x] Size=0 triggers validation error
