/**
 * T3MP3ST BLU3H4T — Detection Bus
 *
 * Central EventEmitter hub for the detection engine. Ingested events
 * are fanned out to all registered detectors; detector alerts flow
 * back through the bus to the correlator and consumers.
 *
 * Features: deduplication, severity escalation, backpressure, optional WAL.
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import { writeFileSync, appendFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type {
  NormalizedEvent,
  DetectionAlert,
  CorrelatedAlert,
  DetectionBusEvents,
} from './types.js';

// =============================================================================
// BUS CONFIG
// =============================================================================

export interface DetectionBusConfig {
  maxEventsPerSecond: number;
  enableWAL: boolean;
  walPath: string;
  /** Time window for dedup (ms) — same rule+source within window = skip */
  dedupWindowMs: number;
}

const DEFAULT_BUS_CONFIG: DetectionBusConfig = {
  maxEventsPerSecond: 0,
  enableWAL: false,
  walPath: './detection-wal.jsonl',
  dedupWindowMs: 5000,
};

// =============================================================================
// DETECTION BUS
// =============================================================================

export class DetectionBus extends EventEmitter<DetectionBusEvents> {
  private config: DetectionBusConfig;

  private eventCount = 0;
  private eventWindowStart = Date.now();

  /** Dedup: ruleId+sourceIP → last alert timestamp */
  private recentAlerts: Map<string, number> = new Map();
  private dedupCleanupTimer?: ReturnType<typeof setInterval>;

  private running = false;

  constructor(config?: Partial<DetectionBusConfig>) {
    super();
    this.config = { ...DEFAULT_BUS_CONFIG, ...config };
  }

  start(): void {
    this.running = true;
    this.dedupCleanupTimer = setInterval(() => this.cleanupDedupCache(), 30_000);

    if (this.config.enableWAL) {
      this.initWAL();
    }
  }

  stop(): void {
    this.running = false;
    if (this.dedupCleanupTimer) {
      clearInterval(this.dedupCleanupTimer);
      this.dedupCleanupTimer = undefined;
    }
  }

  /**
   * Ingest a normalized event from a connector or internal source.
   * Applies backpressure if rate limit exceeded.
   */
  ingest(event: NormalizedEvent): boolean {
    if (!this.running) return false;

    if (this.config.maxEventsPerSecond > 0 && this.isOverRate()) {
      this.emit('bus:backpressure', {
        currentRate: this.eventCount,
        maxRate: this.config.maxEventsPerSecond,
      });
      return false;
    }

    this.eventCount++;

    if (this.config.enableWAL) {
      this.writeWAL('event', event);
    }

    this.emit('event:ingested', event);
    return true;
  }

  /**
   * Raise a detection alert from a detector.
   * Applies dedup before propagation.
   */
  raiseAlert(alert: DetectionAlert): boolean {
    if (!this.running) return false;

    const dedupKey = `${alert.ruleId}:${alert.event.sourceIP ?? 'unknown'}`;
    const lastSeen = this.recentAlerts.get(dedupKey);
    if (lastSeen && alert.timestamp - lastSeen < this.config.dedupWindowMs) {
      return false;
    }
    this.recentAlerts.set(dedupKey, alert.timestamp);

    if (this.config.enableWAL) {
      this.writeWAL('alert', alert);
    }

    this.emit('alert:raised', alert);
    return true;
  }

  /**
   * Publish a correlated alert (from the correlator).
   */
  publishCorrelation(correlated: CorrelatedAlert): void {
    if (!this.running) return;

    if (this.config.enableWAL) {
      this.writeWAL('correlated', correlated);
    }

    this.emit('alert:correlated', correlated);

    if (correlated.severity === 'critical' || correlated.severity === 'high') {
      this.emit('alert:escalated', correlated);
    }
  }

  /**
   * Create a NormalizedEvent with defaults.
   */
  static createEvent(partial: Partial<NormalizedEvent> & { source: string; sourceType: NormalizedEvent['sourceType'] }): NormalizedEvent {
    return {
      id: randomUUID(),
      timestamp: Date.now(),
      data: {},
      raw: '',
      ...partial,
    };
  }

  /**
   * Create a DetectionAlert with defaults.
   */
  static createAlert(
    partial: Omit<DetectionAlert, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
  ): DetectionAlert {
    return {
      id: randomUUID(),
      timestamp: Date.now(),
      ...partial,
    };
  }

  getStats(): { eventsIngested: number; dedupCacheSize: number; running: boolean } {
    return {
      eventsIngested: this.eventCount,
      dedupCacheSize: this.recentAlerts.size,
      running: this.running,
    };
  }

  // ---------------------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------------------

  private isOverRate(): boolean {
    const now = Date.now();
    if (now - this.eventWindowStart >= 1000) {
      this.eventCount = 0;
      this.eventWindowStart = now;
      return false;
    }
    return this.eventCount >= this.config.maxEventsPerSecond;
  }

  // ---------------------------------------------------------------------------
  // Dedup cleanup
  // ---------------------------------------------------------------------------

  private cleanupDedupCache(): void {
    const cutoff = Date.now() - this.config.dedupWindowMs * 2;
    for (const [key, ts] of this.recentAlerts) {
      if (ts < cutoff) this.recentAlerts.delete(key);
    }
  }

  // ---------------------------------------------------------------------------
  // Write-Ahead Log (hybrid persistence)
  // ---------------------------------------------------------------------------

  private initWAL(): void {
    const dir = dirname(this.config.walPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (!existsSync(this.config.walPath)) {
      writeFileSync(this.config.walPath, '');
    }
  }

  private writeWAL(type: string, data: unknown): void {
    try {
      const line = JSON.stringify({ type, ts: Date.now(), data }) + '\n';
      appendFileSync(this.config.walPath, line);
    } catch {
      this.emit('bus:error', { operation: 'wal_write', error: 'WAL write failed' });
    }
  }

  /**
   * Recover unprocessed events from WAL after crash.
   * Returns events that were ingested but not correlated.
   */
  recoverFromWAL(): NormalizedEvent[] {
    if (!this.config.enableWAL || !existsSync(this.config.walPath)) return [];

    try {
      const lines = readFileSync(this.config.walPath, 'utf-8').trim().split('\n').filter(Boolean);
      const events: NormalizedEvent[] = [];
      for (const line of lines) {
        const entry = JSON.parse(line);
        if (entry.type === 'event') {
          events.push(entry.data as NormalizedEvent);
        }
      }
      return events;
    } catch {
      this.emit('bus:error', { operation: 'wal_recover', error: 'WAL recovery failed' });
      return [];
    }
  }

  /** Truncate the WAL after successful processing */
  truncateWAL(): void {
    if (this.config.enableWAL && existsSync(this.config.walPath)) {
      writeFileSync(this.config.walPath, '');
    }
  }
}

export function createDetectionBus(config?: Partial<DetectionBusConfig>): DetectionBus {
  return new DetectionBus(config);
}
