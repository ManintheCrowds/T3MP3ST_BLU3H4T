import { describe, it, expect } from 'vitest';
import {
  sanitizeDisplayFilter,
  sanitizePcapPath,
  buildPcapSummaryArgv,
  buildLiveCaptureArgv,
  TSHARK_MAX_LIVE_SECONDS,
} from '../arsenal/tshark-tools.js';

describe('tshark sanitizers (fail-closed)', () => {
  it('accepts empty display filter', () => {
    expect(sanitizeDisplayFilter(undefined)).toEqual({ ok: true, filter: '' });
    expect(sanitizeDisplayFilter('')).toEqual({ ok: true, filter: '' });
  });

  it('accepts a simple display filter', () => {
    expect(sanitizeDisplayFilter('tcp.port == 443')).toEqual({
      ok: true,
      filter: 'tcp.port == 443',
    });
  });

  it('rejects shell metacharacters in filters', () => {
    expect(sanitizeDisplayFilter('tcp; id').ok).toBe(false);
    expect(sanitizeDisplayFilter('tcp && true').ok).toBe(false);
    expect(sanitizeDisplayFilter('tcp`id`').ok).toBe(false);
  });

  it('rejects path traversal and metacharacters in pcap paths', () => {
    expect(sanitizePcapPath('../x.pcap').ok).toBe(false);
    expect(sanitizePcapPath('cap;rm.pcap').ok).toBe(false);
    expect(sanitizePcapPath('').ok).toBe(false);
  });

  it('builds pcap summary argv without raw flag strings', () => {
    const res = buildPcapSummaryArgv({
      pcapPath: '/tmp/lab.pcap',
      displayFilter: 'http',
      packetCount: 50,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.argv).toEqual([
      '-r',
      '/tmp/lab.pcap',
      '-q',
      '-z',
      'io,phs',
      '-c',
      '50',
      '-Y',
      'http',
    ]);
  });

  it('rejects live capture off allowlist and empty allowlist', () => {
    expect(buildLiveCaptureArgv({ iface: 'eth0', allowlist: [] }).ok).toBe(false);
    expect(buildLiveCaptureArgv({ iface: 'eth0', allowlist: ['lo'] }).ok).toBe(false);
  });

  it('builds live capture argv only for allowlisted iface', () => {
    const res = buildLiveCaptureArgv({
      iface: 'lo',
      allowlist: ['lo', 'eth0'],
      durationSec: 5,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.argv).toEqual(['-i', 'lo', '-a', 'duration:5', '-q', '-z', 'io,phs']);
  });

  it(`caps live duration at ${TSHARK_MAX_LIVE_SECONDS}s`, () => {
    expect(
      buildLiveCaptureArgv({
        iface: 'lo',
        allowlist: ['lo'],
        durationSec: TSHARK_MAX_LIVE_SECONDS + 1,
      }).ok,
    ).toBe(false);
  });
});
