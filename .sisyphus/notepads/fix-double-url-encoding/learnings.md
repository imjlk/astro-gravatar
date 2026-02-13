## Patterns & Conventions
- URL parameters should be handled by `URLSearchParams` which automatically encodes values. Manual encoding before setting can lead to double encoding.

## Successful Approaches
- Removing `encodeURIComponent` when using `URLSearchParams.set()` for URL parameters.
