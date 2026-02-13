# Learnings: Codebase Improvements

## Technical Patterns
- **Bun Testing**: Bun's native test runner is fast but lacks some configuration options like `coverageThreshold` in `bunfig.toml`. Custom scripts parsing `lcov.info` are a reliable workaround.
- **Astro Coverage**: `.astro` files are not automatically instrumented for coverage by Bun's test runner yet. Testing behavior via compiled output (using component simulators) is the best current strategy.
- **Strict TypeScript**: Enabling strict flags (`noUnusedLocals`, `noUnusedParameters`) exposed significant dead code in tests and mocks, which is good for cleanup but requires meticulous verification.

## Gotchas
- **Magic Numbers**: Replacing magic numbers with constants requires careful coordination across multiple files (`hash.ts`, `GravatarClient.ts`) to ensure values align (e.g., `DEFAULT_CACHE_MAX_SIZE` mismatch: 100 vs 1000).
- **Test Expectations**: When refactoring constants, tests often have hardcoded expectations that must be updated simultaneously (e.g., `expect(stats.maxSize).toBe(1000)`).
- **LSP Dependencies**: Missing `typescript-language-server` in the environment hampers real-time error detection, making `bun tsc` verification essential after every edit.

## Decisions
- **Constants Centralization**: Moved all magic numbers to `src/constants.ts` to prevent drift and improve maintainability.
- **Coverage Enforcement**: Implemented `scripts/check-coverage.ts` to strictly enforce >90% coverage in CI, as Bun doesn't support it natively yet.
- **Performance Fix**: Implemented in-flight deduplication in `hash.ts` using a `Map<string, Promise<string>>` to prevent redundant crypto operations for parallel requests.
