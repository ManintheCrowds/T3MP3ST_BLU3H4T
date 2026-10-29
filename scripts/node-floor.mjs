// Patched lines for CVE-2026-111497 (Node.js Brotli decoder, October 21, 2026).
// Node 18, 20, 23, and 25 are end of life and have no fix. Later majors are
// rejected until they are added here on purpose.

const PATCHED_LINES = [
  [22, 23, 4],
  [24, 22, 1],
  [26, 12, 1],
];

export function parseNodeVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version));
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareParts(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

export function isPatchedNode(version) {
  const parts = parseNodeVersion(version);
  if (!parts) return false;
  return PATCHED_LINES.some(([major, minor, patch]) =>
    parts[0] === major && compareParts(parts, [major, minor, patch]) >= 0);
}

export function assertNodeFloorSamples() {
  const patched = ['22.23.4', '22.24.0', '24.22.1', '24.23.0', '26.12.1', '26.13.0', 'v22.23.4'];
  const vulnerable = ['18.20.8', '20.19.5', '22.23.3', '23.11.0', '24.22.0', '25.2.1', '26.12.0', '27.0.0', ''];
  for (const version of patched) {
    if (!isPatchedNode(version)) {
      throw new Error(`patched sample rejected: ${version}`);
    }
  }
  for (const version of vulnerable) {
    if (isPatchedNode(version)) {
      throw new Error(`unpatched sample accepted: ${version || '(empty)'}`);
    }
  }
}
