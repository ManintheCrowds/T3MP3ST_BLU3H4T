/**
 * T3MP3ST BLU3H4T — Alert Correlator
 *
 * Groups alerts within a time window, boosts confidence when multiple
 * detectors agree, deduplicates by source+rule, and produces
 * CorrelatedAlerts for governance routing.
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import type {
  DetectionAlert,
  CorrelatedAlert,
} from './types.js';
import type { Severity } from '../types/index.js';
import type { DetectionBus } from './bus.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface CorrelatorEvents {
  'correlation:created': CorrelatedAlert;
  'correlation:escalated': CorrelatedAlert;
  'correlation:flushed': { count: number };
}

// =============================================================================
// CORRELATOR CONFIG
// =============================================================================

export interface CorrelatorConfig {
  /** Time window for grouping alerts (ms) */
  windowMs: number;
  /** Minimum alerts in window to create a correlation */
  minAlerts: number;
  /** Confidence boost per additional detector type */
  confidenceBoostPerDetector: number;
  /** Flush interval for pending correlations (ms) */
  flushIntervalMs: number;
}

const DEFAULT_CORRELATOR_CONFIG: CorrelatorConfig = {
  windowMs: 30_000,
  minAlerts: 1,
  confidenceBoostPerDetector: 0.1,
  flushIntervalMs: 10_000,
};

// =============================================================================
// ALERT CORRELATOR
// =============================================================================

export class AlertCorrelator extends EventEmitter<CorrelatorEvents> {
  private config: CorrelatorConfig;
  private bus?: DetectionBus;

  /** Pending alerts grouped by source IP */
  private pendingGroups: Map<string, DetectionAlert[]> = new Map();
  /** Last flush timestamp per source */
  private lastFlush: Map<string, number> = new Map();

  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<CorrelatorConfig>) {
    super();
    this.config = { ...DEFAULT_CORRELATOR_CONFIG, ...config };
  }

  attach(bus: DetectionBus): void {
    this.bus = bus;
    bus.on('alert:raised', (alert) => this.addAlert(alert));
    this.flushTimer = setInterval(() => this.flushAll(), this.config.flushIntervalMs);
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.flushAll();
  }

  addAlert(alert: DetectionAlert): void {
    const source = alert.event.sourceIP ?? 'unknown';

    let group = this.pendingGroups.get(source);
    if (!group) {
      group = [];
      this.pendingGroups.set(source, group);
    }
    group.push(alert);

    if (alert.severity === 'critical') {
      this.flushSource(source);
    }
  }

  private flushAll(): void {
    let totalFlushed = 0;
    const now = Date.now();

    for (const [source, alerts] of this.pendingGroups) {
      const lastFlushTime = this.lastFlush.get(source) ?? 0;
      if (now - lastFlushTime < this.config.windowMs && alerts.every((a) => a.severity !== 'critical')) {
        continue;
      }

      this.flushSource(source);
      totalFlushed++;
    }

    if (totalFlushed > 0) {
      this.emit('correlation:flushed', { count: totalFlushed });
    }
  }

  private flushSource(source: string): void {
    const alerts = this.pendingGroups.get(source);
    if (!alerts || alerts.length === 0) return;

    this.pendingGroups.delete(source);
    this.lastFlush.set(source, Date.now());

    if (alerts.length < this.config.minAlerts) return;

    const correlated = this.correlate(source, alerts);
    this.emit('correlation:created', correlated);
    this.bus?.publishCorrelation(correlated);
  }

  private correlate(source: string, alerts: DetectionAlert[]): CorrelatedAlert {
    const detectorTypes = new Set(alerts.map((a) => a.detectorType));

    const baseConfidence = alerts.reduce((sum, a) => sum + a.confidence, 0) / alerts.length;
    const detectorBoost = (detectorTypes.size - 1) * this.config.confidenceBoostPerDetector;
    const confidence = Math.min(baseConfidence + detectorBoost, 1);

    const severity = this.escalateSeverity(alerts, detectorTypes.size);

    const aiAlerts = alerts.filter((a) => a.detectorType === 'ai_detector');
    const aiAgentDetected = aiAlerts.length > 0;

    const descriptions: string[] = [];
    for (const type of detectorTypes) {
      const typeAlerts = alerts.filter((a) => a.detectorType === type);
      descriptions.push(`${type}: ${typeAlerts.length} alert(s)`);
    }

    const killChainPhases = alerts
      .map((a) => a.mitreId)
      .filter((id): id is string => Boolean(id))
      .join(', ');

    return {
      id: randomUUID(),
      alerts,
      severity,
      confidence,
      sourceIP: source,
      description: `Correlated ${alerts.length} alerts from ${source} — ${descriptions.join('; ')}`,
      aiAgentDetected,
      frameworkId: aiAlerts.length > 0 ? this.extractFrameworkId(aiAlerts) : undefined,
      killChainPhase: killChainPhases || undefined,
      timestamp: Date.now(),
      correlationWindowMs: this.config.windowMs,
    };
  }

  private escalateSeverity(alerts: DetectionAlert[], detectorCount: number): Severity {
    const severityOrder: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
    const maxIdx = Math.max(...alerts.map((a) => severityOrder.indexOf(a.severity)));

    if (detectorCount >= 3 && maxIdx < severityOrder.length - 1) {
      return severityOrder[maxIdx + 1];
    }

    return severityOrder[maxIdx];
  }

  private extractFrameworkId(aiAlerts: DetectionAlert[]): string | undefined {
    for (const alert of aiAlerts) {
      const fwMatch = alert.description.match(/Framework:\s*(.+?)(?:\s*\(|$)/);
      if (fwMatch) return fwMatch[1].trim();
    }
    return undefined;
  }

  getStats(): { pendingSources: number; totalPendingAlerts: number } {
    let total = 0;
    for (const alerts of this.pendingGroups.values()) {
      total += alerts.length;
    }
    return { pendingSources: this.pendingGroups.size, totalPendingAlerts: total };
  }
}

export function createAlertCorrelator(config?: Partial<CorrelatorConfig>): AlertCorrelator {
  return new AlertCorrelator(config);
}
