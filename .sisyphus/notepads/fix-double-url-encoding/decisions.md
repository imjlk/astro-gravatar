## Architectural Choices
- Relied on built-in `URLSearchParams` encoding behavior to ensure correct URL parameter encoding without redundancy.

## Rationales
- `URLSearchParams.toString()` encodes all parameters, so passing already encoded strings results in double encoding (e.g., `%` becoming `%25`).
