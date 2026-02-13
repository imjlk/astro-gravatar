## TTL Unit Confusion
- Gravatar API rate limit reset headers (X-RateLimit-Reset) are in Unix timestamp (seconds).
- JavaScript's Date.now() returns milliseconds.
- Subtraction between them without conversion leads to huge negative numbers and immediate cache expiration.
- Fixed by converting current time to seconds: `Math.floor(Date.now() / 1000)`.
- Test mocks were also updated to use seconds to realistically verify the fix.
