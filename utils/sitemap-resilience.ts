type Snapshot<T> = { data: T; timestamp: number }

/**
 * Wraps a fetcher with a last-known-good fallback: on failure, reuse the
 * most recent successful result (if still fresh) instead of collapsing to
 * an empty/static result just because one upstream call had a transient
 * failure. Each call site should keep its own instance (module-scope state,
 * process-local -- resets on cold start; upgrade to a shared store only if
 * cross-instance resilience becomes a real problem).
 */
export function createLastKnownGood<T>(maxAgeMs: number, now: () => number = Date.now) {
  let snapshot: Snapshot<T> | null = null

  return async function resolve(fetcher: () => Promise<T>, fallback: T): Promise<T> {
    try {
      const data = await fetcher()
      snapshot = { data, timestamp: now() }
      return data
    } catch {
      if (snapshot && now() - snapshot.timestamp < maxAgeMs) {
        return snapshot.data
      }
      return fallback
    }
  }
}
