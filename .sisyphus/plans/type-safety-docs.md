# Plan: Type Safety & Documentation Hardening

## TL;DR

> **Quick Summary**: Improve type safety by replacing `any` with `unknown` in core types and enhancing JSDoc with default values and examples.
> 
> **Deliverables**:
> - Strict `types.ts` (no `any` defaults)
> - Enhanced JSDoc in `GravatarAvatar.astro` (with `@default`)
> - Enhanced JSDoc in `lib/gravatar.ts` (with `@example`)
> - Zero type errors in `bun run typecheck`
> 
> **Estimated Effort**: Small
> **Parallel Execution**: Sequential (Refactor -> Docs -> Verify)

---

## Context

### Original Request
"Improvement" -> narrowed to "Type Safety & Docs".

### Metis Review
**Identified Gaps** (addressed):
- **Breaking Change**: Changing `GravatarApiResponse<T=any>` to `unknown` requires casting in usage.
- **Cache Logic**: `apiCache` needs update to store `unknown` and cast `as T` on retrieval.
- **ESLint**: Explicitly excluded from scope (keep it simple).

---

## Work Objectives

### Core Objective
Make the codebase strict-compliant and developer-friendly by removing loose types and documenting default behaviors.

### Concrete Deliverables
- `packages/astro-gravatar/src/lib/types.ts`: Updated generic defaults.
- `packages/astro-gravatar/src/lib/gravatar.ts`: Updated cache types and added JSDoc.
- `packages/astro-gravatar/src/components/GravatarAvatar.astro`: Updated prop docs.

### Definition of Done
- [x] `bun run typecheck` passes with 0 errors.
- [x] `bun test` passes (no regressions).
- [x] No `any` found in `types.ts` generic defaults.

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verifications are agent-executed via `bash` or `read`.

### Test Decision
- **Infrastructure exists**: YES (`bun test`)
- **Automated tests**: YES (Regression testing)
- **Framework**: `bun test`

### Agent-Executed QA Scenarios

#### Scenario 1: Type Checking
**Tool**: Bash
**Steps**:
1. Run `bun run typecheck` in `packages/astro-gravatar`
2. Assert exit code 0
3. Assert no error output

#### Scenario 2: Any Removal
**Tool**: Bash (grep)
**Steps**:
1. `grep "any" packages/astro-gravatar/src/lib/types.ts`
2. Assert output count is 0 (or significantly reduced/justified)

#### Scenario 3: Documentation Check
**Tool**: Read
**Steps**:
1. Read `packages/astro-gravatar/src/components/GravatarAvatar.astro`
2. Assert content contains `@default` tags for `size` and `rating`

---

## TODOs

- [x] 1. Harden Type Definitions

  **What to do**:
  - Update `src/lib/types.ts`:
    - Change `GravatarApiResponse<T = any>` to `GravatarApiResponse<T = unknown>`
    - Change `CacheEntry<T = any>` to `CacheEntry<T = unknown>`
  - Update `src/lib/gravatar.ts`:
    - Change `apiCache` definition to `Map<string, { data: unknown; expires: number }>`
    - In `makeRequest`, cast cached data: `return { data: cached.data as T }`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`typescript`]

  **Acceptance Criteria**:
  - [x] `grep "T = any" packages/astro-gravatar/src/lib/types.ts` returns empty
  - [x] `bun run typecheck` passes

- [x] 2. Enhance Library JSDoc

  **What to do**:
  - Update `src/lib/gravatar.ts`:
    - Add `@example` tag to `buildAvatarUrl`
    - Add `@example` tag to `getProfile`
    - Add `@throws` tags where `GravatarError` is thrown

  **Recommended Agent Profile**:
  - **Category**: `writing`

  **Acceptance Criteria**:
  - [x] `grep "@example" packages/astro-gravatar/src/lib/gravatar.ts` returns matches

- [x] 3. Enhance Component JSDoc

  **What to do**:
  - Update `src/components/GravatarAvatar.astro`:
    - Add `@default 80` to `size` prop doc
    - Add `@default 'g'` to `rating` prop doc
    - Add `@default false` to `lazy` prop doc
  - Update `src/components/GravatarProfileCard.astro`:
    - Add `@default 'default'` to `template` prop doc

  **Recommended Agent Profile**:
  - **Category**: `writing`

  **Acceptance Criteria**:
  - [x] `grep "@default 80" packages/astro-gravatar/src/components/GravatarAvatar.astro` matches

- [x] 4. Final Verification

  **What to do**:
  - Run full test suite to ensure no regressions from type changes.
  - Run typecheck one last time.

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Acceptance Criteria**:
  - [x] `bun test` passes (315 tests)
  - [x] `bun run typecheck` passes

---

## Success Criteria

### Verification Commands
```bash
cd packages/astro-gravatar && bun run typecheck && bun test
```

### Final Checklist
- [x] No `any` in generic defaults
- [x] JSDoc contains examples
- [x] Tests pass
