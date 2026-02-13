# Test Helpers Coverage - Learnings

## 2026-02-13: Rate Limit Queue (Task 3.2)

### Implementation Pattern: Internal Queue Class

Added `RateLimitQueue` class inside `GravatarClient.ts` (not separate file):
- Priority queue support with configurable concurrency
- Promise-based slot waiting instead of polling
- Automatic retry on rate limit (already existed, verified working)

### Key Design Decisions

1. **Queue Inside GravatarClient**:
   - Added `RateLimitQueue` class at top of file
   - Initialized in constructor with `config.rateLimit.maxConcurrent`
   - Replaced polling-based `setInterval` approach with queue

2. **Priority Queue Support**:
   - `enqueue<T>(fn, priority = 0)` method
   - Higher priority items processed first
   - Default priority of 0 for FIFO behavior

3. **Queue Statistics**:
   - Added `getQueueStats()` returning `{ pending, active, maxConcurrent }`
   - Useful for monitoring and debugging

4. **Integration Pattern**:
   - `getProfiles()` now wraps each request with `queue.enqueue()`
   - Queue handles concurrency control, `getProfile()` just executes
   - Failed requests don't block queue (error propagates, next item processes)

### Test Patterns

1. **Testing Concurrency Limits**:
   ```typescript
   let concurrentCount = 0, maxConcurrent = 0;
   fetchMock.mockImplementation(async () => {
     concurrentCount++;
     maxConcurrent = Math.max(maxConcurrent, concurrentCount);
     await delay(50);
     concurrentCount--;
   });
   expect(maxConcurrent).toBeLessThanOrEqual(2);
   ```

2. **Testing FIFO Order**:
   - Use call counter, not URL parsing (URLs contain hashes, not emails)
   - Verify processing order matches input order

3. **Testing Non-Blocking Failures**:
   - Use index-based failure pattern: `if (idx === 0 || idx === 2) throw ...`
   - Verify all requests were attempted (callCount)

4. **Testing Slot Waiting**:
   - Use resolvers array to control promise completion
   - Track startedCount to verify queue behavior
   - Wait for first N requests, then resolve one to trigger next

### File Structure
- Modified: `packages/astro-gravatar/src/lib/GravatarClient.ts`
- Modified: `packages/astro-gravatar/src/lib/__tests__/GravatarClient.test.ts`
- Tests: 27 passing (5 new queue tests)
- Coverage: 97.73% functions, 99.80% lines

## 2026-02-13: test-helpers.ts Coverage (53.50% → 100%)

## 2026-02-13: test-helpers.ts Coverage (53.50% → 100%)

### Test Patterns Discovered

1. **Testing hooks-based functions**: Functions like `setupTestEnvironment()` that use `beforeAll`, `afterEach`, `afterAll` cannot be called inside a test. Call them at module/describe level instead.

2. **Event readonly properties**: Native `Event` objects have readonly properties (like `target`). `Object.assign()` cannot write to them. Test only the event type, not custom properties.

3. **`as const` vs `Object.freeze()`**: TypeScript's `as const` provides type-level readonly but doesn't freeze at runtime. Tests should verify behavior, not type-system guarantees.

4. **Fetch mock patterns**:
   - Use `global.fetch` assignment for mocking
   - Always restore original fetch in cleanup
   - Clone responses for reusability

5. **Coverage strategies**:
   - Test internal functions through their public API consumers
   - Use integration-style tests to cover hook setup functions
   - Test `mockDefaultFetch` by using `setupFetchWithResponses` cleanup

### File Structure
- Created: `packages/astro-gravatar/test-utils/test-helpers.test.ts`
- Tests: 99 passing
- Coverage: 100% lines, 90.70% functions

## 2026-02-13: hash.ts Coverage (85.71% → 100% functions)

### Test Patterns Discovered

1. **Regex extraction edge cases**: The `extractHash()` regex `/gravatar\.com\/([a-f0-9]{64})/i` matches the FIRST 64 hex chars even in longer strings. URLs with >64 hex chars after gravatar.com/ will still extract a valid hash.

2. **Email validation gotcha**: URLs containing `@` (like `https://gravatar.com/avatar/test@example.com`) can pass email validation because the regex only checks for `@` and dots, not URL structure.

3. **Cache eviction testing**: To trigger cache eviction path, fill cache beyond `CACHE_MAX_SIZE` (1000 entries). Eviction removes half (500 oldest entries).

4. **In-flight deduplication**: Use `Promise.all()` with multiple concurrent calls to test in-flight promise sharing. All results should be identical and cache should have single entry.

5. **Unreachable code paths**: The non-GravatarError catch block in `hashEmail` (lines 63-65) is essentially unreachable - `crypto.subtle.digest` doesn't throw non-GravatarError exceptions in normal operation.

### Edge Cases Covered
- `hashEmails([])` - empty array returns empty array
- `extractHash()` with malformed URLs (invalid hash formats, various URL patterns)
- Cache eviction during concurrent access
- In-flight deduplication behavior

### File Structure
- Modified: `packages/astro-gravatar/src/utils/__tests__/hash.test.ts`
- Tests: 83 passing (25 new tests added)
- Coverage: 100% functions, 96.36% lines

## 2026-02-13: ESLint Configuration

### ESLint 10 Uses Flat Config Format
- ESLint 10+ uses `eslint.config.js` (flat config) instead of `.eslintrc.js`
- Required packages: `eslint`, `@eslint/js`, `typescript-eslint`, `globals`
- Old `.eslintrc.*` files are NOT recognized by ESLint 10+

### TypeScript ESLint Configuration Pattern
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
    },
  },
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', '**/__tests__/**'] }
);
```

### Code Fixes Applied
1. **`no-explicit-any` in Type Casts**: `response.headers.entries()` works directly without `as any`
2. **Useless Catch Blocks**: Removed `catch (error) { throw error; }` patterns
3. **Unused Variable Pattern**: Use `_` prefix with `varsIgnorePattern: '^_'` for destructuring

### File Structure
- Created: `eslint.config.js` (ESLint 10 flat config)
- Modified: `package.json` (added lint script, devDependencies)
- Modified: `src/lib/GravatarClient.ts`, `src/lib/gravatar.ts`, `src/env.d.ts` (fixed lint errors)
- Modified: `README.md` (added lint instructions)

## 2026-02-13: Prettier Configuration

### Prettier Plugin for Astro Compatibility
- `prettier-plugin-astro` has parsing issues with certain Astro component patterns
- Inline `<script>` tags with modern JS syntax can cause parser errors
- Async/await patterns in component code fences may trigger false syntax errors

### Prettierignore Strategy
- Exclude `.astro` files from Prettier until plugin matures
- Exclude `.mdx` files (docs contain JSX-like code that confuses Prettier)
- Exclude `apps/` directory (documentation site with complex MDX)

### Standard Prettier Settings Used
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"]
}
```

### Format Scripts
- `format`: `prettier --write .` - Auto-format all files
- `format:check`: `prettier --check .` - CI verification

### File Structure
- Created: `.prettierrc` (configuration)
- Created: `.prettierignore` (exclusions)
- Modified: `package.json` (added format scripts, prettier devDependency)
- Modified: `README.md` (added format documentation)

## 2026-02-13: Request Deduplication Utility (TDD)

### Implementation Pattern: Factory Function (Not Singleton)

Request-scoped deduplicator using factory function pattern:
```typescript
export function createRequestDeduplicator(ttlMs: number = 5000): RequestDeduplicator {
  const inFlight = new Map<string, Promise<unknown>>();
  const cache = new Map<string, CachedResult<unknown>>();
  let generation = 0;
  // ...returns object with deduplicate and clear methods
}
```

### Key Design Decisions

1. **Two-Layer Architecture**:
   - `inFlight` map: Deduplicates concurrent requests while one is in progress
   - `cache` map: Stores completed results with TTL

2. **Generation Counter for clear()**:
   - When `clear()` is called, generation increments
   - In-flight promises check generation before caching results
   - Prevents stale promises from populating cache after clear

3. **Request-Scoped (SSR-Safe)**:
   - Factory function creates independent instances
   - No global singletons that could cause cross-request contamination
   - Each request gets its own deduplicator instance

### Test Patterns

1. **Testing In-Flight Deduplication**:
   ```typescript
   const [r1, r2, r3] = await Promise.all([
     deduplicator.deduplicate('key', fn),
     deduplicator.deduplicate('key', fn),
     deduplicator.deduplicate('key', fn),
   ]);
   expect(fn).toHaveBeenCalledTimes(1); // Only one call
   ```

2. **Testing TTL Expiration**:
   ```typescript
   vi.useFakeTimers();
   await deduplicator.deduplicate('key', fn);
   vi.advanceTimersByTime(ttl + 1);
   await deduplicator.deduplicate('key', fn);
   expect(fn).toHaveBeenCalledTimes(2); // New call after TTL
   ```

3. **Testing clear() with In-Flight Promises**:
   - Collect resolvers in array to resolve promises individually
   - Clear between calls to verify isolation

4. **Testing Zero TTL**:
   - `createRequestDeduplicator(0)` disables caching
   - Each sequential call makes new request (only in-flight dedup)

### Edge Cases Covered
- Null/undefined results
- Empty string keys
- Concurrent calls during TTL window (should use cache)
- Error propagation to all waiting callers
- Separate instances don't share state (SSR safety)

### File Structure
- Created: `packages/astro-gravatar/src/lib/deduplication.ts`
- Created: `packages/astro-gravatar/src/lib/__tests__/deduplication.test.ts`
- Tests: 21 passing
- Coverage: 100% lines, 100% functions

## 2026-02-13: CLI for Offline URL Generation (Task 4.1)

### Implementation Pattern: Simple Argument Parsing (No External Libraries)

Used native argument parsing with switch/if-else:
```typescript
function parseArgs(argv: string[]): ParsedArgs {
  // Handle --key=value and --key value syntax
  // Convert kebab-case to camelCase for option names
  // Track command vs positional arguments
}
```

### Key Design Decisions

1. **Separate CLI Entry Point**:
   - Added `./cli` export in package.json
   - Added `bin` field for executable: `astro-gravatar`
   - CLI is not bundled into main package

2. **Option Name Conflict Resolution**:
   - `--version` is reserved for CLI version flag
   - QR code version uses `--qr-version` instead
   - This avoids ambiguity between CLI metadata and command options

3. **Equals Syntax Support**:
   - Parser handles both `--email value` and `--email=value`
   - Check for `=` in argument string and split accordingly

4. **JSON Output**:
   - All successful output goes to stdout as JSON
   - Errors go to stderr with `Error:` prefix
   - Exit code 0 for success, 1 for errors

5. **Validation Functions**:
   - Each option has dedicated validator (validateEmail, validateSize, etc.)
   - Validators call `outputError()` which exits with code 1

### Test Patterns

1. **CLI Integration Testing via spawn**:
   ```typescript
   const proc = spawn('bun', ['run', CLI_PATH, ...args]);
   // Capture stdout, stderr, and exit code
   ```

2. **Testing Command Options**:
   - Test each option individually
   - Verify URL contains expected query parameters

3. **Testing Error Cases**:
   - Missing required options
   - Invalid option values (out of range, invalid enum)

### SHA-256 Hash for test@example.com
The correct hash is `973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b` (not `55502f40dc8b7c769880b87414b4f9e2` which is MD5).

### File Structure
- Created: `packages/astro-gravatar/src/cli/index.ts`
- Created: `packages/astro-gravatar/src/cli/__tests__/index.test.ts`
- Modified: `packages/astro-gravatar/package.json` (added exports, bin)
- Tests: 24 passing
- Overall coverage: 98.84% functions, 99.39% lines
