/**
 * Shared authorized-scope matching for governance gates and mission phase checks.
 */

/**
 * Returns true when `target` is authorized by at least one pattern in `scopePatterns`.
 *
 * Patterns:
 * - Exact match on full target string
 * - Domain suffix (`.example.com` matches `app.example.com`)
 * - Hostname extracted from URLs
 */
export function isTargetInAuthorizedScope(target: string, scopePatterns: readonly string[]): boolean {
  if (scopePatterns.length === 0) return false;
  if (scopePatterns.includes(target)) return true;

  let hostname: string;
  try {
    hostname = new URL(target.includes('://') ? target : `https://${target}`).hostname;
  } catch {
    hostname = target;
  }

  return scopePatterns.some((pattern) => {
    if (pattern.startsWith('.')) {
      return hostname.endsWith(pattern) || hostname === pattern.slice(1);
    }
    return hostname === pattern;
  });
}
