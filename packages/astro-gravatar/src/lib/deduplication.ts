const DEFAULT_TTL_MS = 5000;

interface CachedResult<T> {
  result: T;
  timestamp: number;
  generation: number;
}

export interface RequestDeduplicator {
  deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T>;
  clear(): void;
}

export function createRequestDeduplicator(ttlMs: number = DEFAULT_TTL_MS): RequestDeduplicator {
  const inFlight = new Map<string, Promise<unknown>>();
  const cache = new Map<string, CachedResult<unknown>>();
  const ttl = ttlMs;
  let generation = 0;

  return {
    async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const now = Date.now();
      const currentGeneration = generation;

      const cached = cache.get(key);
      if (
        cached &&
        cached.generation === currentGeneration &&
        ttl > 0 &&
        now - cached.timestamp < ttl
      ) {
        return cached.result as T;
      }

      const inFlightPromise = inFlight.get(key);
      if (inFlightPromise) {
        return inFlightPromise as Promise<T>;
      }

      const promise = fn();
      inFlight.set(key, promise);

      try {
        const result = await promise;
        if (ttl > 0 && generation === currentGeneration) {
          cache.set(key, { result, timestamp: now, generation: currentGeneration });
        }
        return result;
      } finally {
        inFlight.delete(key);
      }
    },

    clear(): void {
      generation++;
      inFlight.clear();
      cache.clear();
    },
  };
}
