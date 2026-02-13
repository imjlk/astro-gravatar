- Moving cache eviction logic to after the `set` operation allows for a simpler `entries.length - maxSize` calculation while strictly maintaining the `maxSize` limit.

## Error Code Conventions
- Use `GRAVATAR_ERROR_CODES.INVALID_EMAIL` strictly for email format validation.
- Use `GRAVATAR_ERROR_CODES.INVALID_RESPONSE` for other parameter validation errors (like size, version, type) when the input is technically valid type-wise but logically invalid for the specific context.
- URLSearchParams automatically encodes values, so manual encoding before adding to params results in double encoding. Using  handles both raw strings and URLs correctly.
- URLSearchParams automatically encodes values, so manual encoding before adding to params results in double encoding. Using `params.set('d', url)` handles both raw strings and URLs correctly.
