## Patterns & Conventions
- Using `!== undefined` instead of falsy checks for optional numeric parameters is crucial to handle `0` correctly.
- Pre-existing test failures should be investigated and fixed if they block verification of new changes.

## Decisions
- Fixed an existing test in `GravatarAvatar.test.ts` that was expecting double-encoding but receiving single-encoding, which was causing a pre-existing failure.
- Added explicit test cases for `size: 0` in `gravatar.test.ts` to ensure regression testing.
