import { describe, it, expect, spyOn, beforeEach } from "bun:test";
import { hashEmailWithCache, clearEmailHashCache } from "../hash.js";

describe("hashEmailWithCache deduplication", () => {
  beforeEach(() => {
    clearEmailHashCache();
  });

  it("should deduplicate in-flight hashing requests", async () => {
    const email = "test@example.com";
    
    const digestSpy = spyOn(crypto.subtle, "digest");

    const results = await Promise.all([
      hashEmailWithCache(email),
      hashEmailWithCache(email),
      hashEmailWithCache(email),
    ]);

    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);

    expect(digestSpy).toHaveBeenCalledTimes(1);
    
    digestSpy.mockRestore();
  });
});
