## Patterns and Conventions
- Cache eviction should happen after adding a new item if the size exceeds maxSize.
- Calculation of items to remove should be exactly entries.length - maxSize when eviction happens after adding.
