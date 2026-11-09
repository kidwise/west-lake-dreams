/**
 * Tiny wrapper around localStorage. Storage can be unavailable (private mode,
 * embedded webviews, blocked site data), so every access is guarded and the
 * game keeps working without it.
 */
const PREFIX = 'wld.';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore — persistence is a convenience, not a requirement */
  }
}
