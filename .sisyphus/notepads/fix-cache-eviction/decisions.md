## Decisions
- Moved evictOldestEntries() call to after this.cache.set() in GravatarClient.ts.
- Changed condition from >= maxSize to > maxSize to reflect post-add eviction.
- Removed +1 from toRemove calculation in evictOldestEntries().
