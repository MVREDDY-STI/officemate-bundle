import { apiGet, apiPatch } from './api';

// ─────────────────────────────────────────────────────────────
// Micro-batch engine (DataLoader pattern)
//
// Problem: every EditableField/EditableImage calls getContentBlocks()
// individually from useEffect → N components = N HTTP requests.
//
// Solution: collect all keys queued in the same event-loop tick,
// then fire ONE request for all of them before the tick ends.
//
// Result: a page with 30 editable fields still makes exactly 1 request.
// ─────────────────────────────────────────────────────────────

type BatchResolver = (result: Record<string, string>) => void;

let _pendingKeys: string[]       = [];
let _resolvers:   BatchResolver[] = [];
let _batchTimer:  ReturnType<typeof setTimeout> | null = null;

// Session-level in-memory cache — avoids re-fetching unchanged values
// on same-session page re-visits (key → content value).
const _memCache = new Map<string, string>();

async function _flush(): Promise<void> {
  if (!_pendingKeys.length) return;

  // Snapshot and reset state so new calls during the fetch queue a fresh batch
  const keys      = _pendingKeys.slice();
  const resolvers = _resolvers.slice();
  _pendingKeys = [];
  _resolvers   = [];
  _batchTimer  = null;

  // Keys already in cache don't need to be fetched
  const missing = keys.filter(k => !_memCache.has(k));
  let fetched: Record<string, string> = {};

  if (missing.length > 0) {
    try {
      fetched = await apiGet<Record<string, string>>(
        `/api/v1/content?keys=${encodeURIComponent(missing.join(','))}`,
      );
      // Populate memory cache with fresh values
      for (const [k, v] of Object.entries(fetched)) {
        _memCache.set(k, v);
        // Keep localStorage in sync
        localStorage.setItem(`ef_${k}`, v);
      }
    } catch {
      // API unreachable — leave fetched empty; each component will use localStorage
    }
  }

  // Build the full result map: cache hits + newly fetched
  const fullResult: Record<string, string> = {};
  for (const key of keys) {
    const cached = _memCache.get(key);
    if (cached !== undefined) fullResult[key] = cached;
    else if (fetched[key] !== undefined) fullResult[key] = fetched[key];
  }

  // Resolve every waiting component, each filtered to its own keys
  for (const resolve of resolvers) resolve(fullResult);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Fetch content blocks for the given keys.
 *
 * All calls made within the same event-loop tick are automatically
 * batched into a single HTTP request.  Subsequent calls for already-
 * cached keys are served instantly from memory without any network hit.
 */
export function getContentBlocks(keys: string[]): Promise<Record<string, string>> {
  if (!keys.length) return Promise.resolve({});

  // Keys already fully cached → return synchronously (no network, no batch queue)
  const allCached = keys.every(k => _memCache.has(k));
  if (allCached) {
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = _memCache.get(k)!;
    return Promise.resolve(result);
  }

  return new Promise<Record<string, string>>(resolve => {
    // Add any new keys to the current batch
    for (const key of keys) {
      if (!_pendingKeys.includes(key)) _pendingKeys.push(key);
    }

    // This resolver receives the full batch result and returns only requested keys
    _resolvers.push(fullResult => {
      const filtered: Record<string, string> = {};
      for (const key of keys) {
        if (fullResult[key] !== undefined) filtered[key] = fullResult[key];
      }
      resolve(filtered);
    });

    // Arm the flush timer once per batch — fires after all useEffect hooks in
    // the current render cycle have registered their keys.
    if (!_batchTimer) {
      _batchTimer = setTimeout(_flush, 0);
    }
  });
}

/**
 * Invalidate a specific key from the memory cache (e.g. after a save).
 * Forces the next getContentBlocks call for this key to re-fetch.
 */
export function invalidateContentKey(key: string): void {
  _memCache.delete(key);
}

/**
 * Persist a content block via the API, then update the in-memory cache.
 */
export async function setContentBlock(key: string, value: string): Promise<void> {
  await apiPatch(`/api/v1/content/${encodeURIComponent(key)}`, { content: value });
  // Update cache immediately so other components on the page reflect the change
  _memCache.set(key, value);
}
