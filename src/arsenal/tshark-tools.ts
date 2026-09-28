/**
 * Defensive tshark / Wireshark Arsenal wrappers.
 *
 * Source pack: ManintheCrowds/GearHead contrib/t3mp3st-blu3h4t/wireshark/
 * Sanitizer logic must match sanitize-tshark-args.mjs (fail-closed).
 * Posture: analyze existing captures; do not craft or inject frames.
 */

import type { CustomTool, ToolResult } from '../types/index.js';

export const TSHARK_MAX_FILTER_LEN = 256;
export const TSHARK_MAX_LIVE_SECONDS = 30;
export const TSHARK_MAX_OUTPUT_BYTES = 64 * 1024;

const FILTER_RE = /^[A-Za-z0-9_\s.:()=!<>&\-|"]+$/;
const FORBIDDEN_META = /[;`$\\\n\r]|&&|\|\|/;

export type SanitizeOk<T extends string> = { ok: true } & Record<T, string>;
export type SanitizeErr = { ok: false; error: string };

export function sanitizeDisplayFilter(
  filter: string | undefined,
): SanitizeOk<'filter'> | SanitizeErr {
  if (filter === undefined || filter === null || filter === '') return { ok: true, filter: '' };
  if (typeof filter !== 'string') return { ok: false, error: 'filter must be a string' };
  const trimmed = filter.trim();
  if (trimmed.length > TSHARK_MAX_FILTER_LEN) {
    return { ok: false, error: `filter exceeds ${TSHARK_MAX_FILTER_LEN} chars` };
  }
  if (FORBIDDEN_META.test(trimmed)) {
    return { ok: false, error: 'filter contains forbidden shell metacharacters' };
  }
  if (!FILTER_RE.test(trimmed)) {
    return { ok: false, error: 'filter contains disallowed characters' };
  }
  return { ok: true, filter: trimmed };
}

export function sanitizePcapPath(pcapPath: string): SanitizeOk<'path'> | SanitizeErr {
  if (typeof pcapPath !== 'string' || !pcapPath.trim()) {
    return { ok: false, error: 'pcap_path required' };
  }
  const p = pcapPath.trim();
  if (p.includes('\0')) return { ok: false, error: 'pcap_path contains NUL' };
  if (p.includes('..')) return { ok: false, error: 'pcap_path must not contain ..' };
  if (FORBIDDEN_META.test(p)) {
    return { ok: false, error: 'pcap_path contains forbidden characters' };
  }
  return { ok: true, path: p };
}

export function buildPcapSummaryArgv(opts: {
  pcapPath: string;
  displayFilter?: string;
  packetCount?: number;
}): { ok: true; argv: string[] } | SanitizeErr {
  const pathRes = sanitizePcapPath(opts.pcapPath);
  if (!pathRes.ok) return pathRes;
  const filtRes = sanitizeDisplayFilter(opts.displayFilter ?? '');
  if (!filtRes.ok) return filtRes;

  const count = opts.packetCount ?? 200;
  if (!Number.isInteger(count) || count < 1 || count > 5000) {
    return { ok: false, error: 'packet_count must be integer 1..5000' };
  }

  const argv = ['-r', pathRes.path, '-q', '-z', 'io,phs', '-c', String(count)];
  if (filtRes.filter) {
    argv.push('-Y', filtRes.filter);
  }
  return { ok: true, argv };
}

export function parseIfaceAllowlist(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildLiveCaptureArgv(opts: {
  iface: string;
  allowlist: string[];
  durationSec?: number;
  displayFilter?: string;
}): { ok: true; argv: string[] } | SanitizeErr {
  const allow = Array.isArray(opts.allowlist) ? opts.allowlist : [];
  if (!allow.length) return { ok: false, error: 'interface allowlist empty' };
  if (typeof opts.iface !== 'string' || !allow.includes(opts.iface)) {
    return { ok: false, error: 'interface not on allowlist' };
  }
  const duration = opts.durationSec ?? 10;
  if (!Number.isInteger(duration) || duration < 1 || duration > TSHARK_MAX_LIVE_SECONDS) {
    return { ok: false, error: `duration_sec must be 1..${TSHARK_MAX_LIVE_SECONDS}` };
  }
  const filtRes = sanitizeDisplayFilter(opts.displayFilter ?? '');
  if (!filtRes.ok) return filtRes;

  const argv = ['-i', opts.iface, '-a', `duration:${duration}`, '-q', '-z', 'io,phs'];
  if (filtRes.filter) argv.push('-Y', filtRes.filter);
  return { ok: true, argv };
}

function sliceOutput(stdout: string): string {
  if (stdout.length <= TSHARK_MAX_OUTPUT_BYTES) return stdout;
  return stdout.slice(0, TSHARK_MAX_OUTPUT_BYTES) + '\n…[truncated]';
}

function asInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

type SubprocessRunner = (
  command: string,
  args: string[],
  options?: { timeout?: number; maxOutput?: number },
) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

type ToolAvailability = (command: string) => Promise<boolean>;

/**
 * Build EXTERNAL_TOOLS entries (append after curl_request).
 * Pass arsenal isToolAvailable / runSubprocess to avoid circular imports.
 */
export function createTsharkExternalTools(deps: {
  isToolAvailable: ToolAvailability;
  runSubprocess: SubprocessRunner;
}): CustomTool[] {
  const { isToolAvailable, runSubprocess } = deps;

  return [
    {
      name: 'tshark_pcap_summary',
      description:
        'Defensive: summarize protocols in an existing pcap via tshark (-z io,phs). Requires tshark. No injection.',
      category: 'forensics',
      parameters: [
        { name: 'pcap_path', type: 'string', description: 'Path to .pcap/.pcapng', required: true },
        {
          name: 'display_filter',
          type: 'string',
          description: 'Optional Wireshark display filter',
          required: false,
        },
        {
          name: 'packet_count',
          type: 'number',
          description: 'Max packets 1..5000 (default 200)',
          required: false,
        },
      ],
      handler: async (context): Promise<ToolResult> => {
        if (!(await isToolAvailable('tshark'))) {
          return {
            success: false,
            error: 'tshark is not installed. Install with: apt install tshark',
          };
        }
        const pcapPath = String(context.parameters.pcap_path ?? '');
        const displayFilter =
          context.parameters.display_filter === undefined ||
          context.parameters.display_filter === null
            ? undefined
            : String(context.parameters.display_filter);
        const packetCount = asInt(context.parameters.packet_count, 200);

        const built = buildPcapSummaryArgv({ pcapPath, displayFilter, packetCount });
        if (!built.ok) return { success: false, error: built.error };

        const result = await runSubprocess('tshark', built.argv, { timeout: 60000 });
        if (result.exitCode !== 0) {
          return {
            success: false,
            error: `tshark failed: ${result.stderr || result.stdout || `exit ${result.exitCode}`}`,
          };
        }
        return { success: true, output: sliceOutput(result.stdout) };
      },
    },
    {
      name: 'tshark_live_capture',
      description:
        'Defensive: short live capture on an allowlisted interface (T3MP3ST_TSHARK_IFACES). Max 30s. HITL/receipt recommended.',
      category: 'forensics',
      parameters: [
        {
          name: 'iface',
          type: 'string',
          description: 'Interface name; must be on allowlist',
          required: true,
        },
        { name: 'duration_sec', type: 'number', description: '1..30 seconds', required: false },
        {
          name: 'display_filter',
          type: 'string',
          description: 'Optional display filter',
          required: false,
        },
      ],
      handler: async (context): Promise<ToolResult> => {
        if (!(await isToolAvailable('tshark'))) {
          return {
            success: false,
            error: 'tshark is not installed. Install with: apt install tshark',
          };
        }
        const iface = String(context.parameters.iface ?? '');
        const durationSec = asInt(context.parameters.duration_sec, 10);
        const displayFilter =
          context.parameters.display_filter === undefined ||
          context.parameters.display_filter === null
            ? undefined
            : String(context.parameters.display_filter);
        const allowlist = parseIfaceAllowlist(process.env.T3MP3ST_TSHARK_IFACES);

        const built = buildLiveCaptureArgv({ iface, allowlist, durationSec, displayFilter });
        if (!built.ok) return { success: false, error: built.error };

        const result = await runSubprocess('tshark', built.argv, {
          timeout: (durationSec + 5) * 1000,
        });
        if (result.exitCode !== 0) {
          return {
            success: false,
            error: `tshark live capture failed: ${result.stderr || result.stdout || `exit ${result.exitCode}`}`,
          };
        }
        return { success: true, output: sliceOutput(result.stdout) };
      },
    },
  ];
}
