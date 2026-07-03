/**
 * T3MP3ST BLU3H4T — Anomaly Engine
 *
 * Statistical behavioral detection that doesn't rely on signatures.
 * Maintains per-source sliding-window baselines and alerts when
 * deviations exceed configurable sigma thresholds.
 *
 * Five anomaly types:
 *  - rate:       Request rate spikes from a single source
 *  - pattern:    Requests to unusual/sensitive paths
 *  - timing:     Activity outside expected time windows
 *  - volume:     Unusual data transfer volumes
 *  - sequential: Systematic enumeration patterns
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import type {
  AnomalyBaseline,
  AnomalyConfig,
  AnomalyType,
  DetectionAlert,
  NormalizedEvent,
} from './types.js';
import type { DetectionBus } from './bus.js';
import { SENSITIVE_PATHS } from './payloads.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface AnomalyEngineEvents {
  'anomaly:detected': DetectionAlert;
  'anomaly:baseline_established': { source: string; type: AnomalyType };
  'anomaly:baseline_updated': { source: string; type: AnomalyType };
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  observationWindowMs: 24 * 60 * 60 * 1000,
  sigmaThreshold: 3,
  minBaselineSamples: 100,
  enabledTypes: ['rate', 'pattern', 'timing', 'volume', 'sequential'],
};

// =============================================================================
// ANOMALY ENGINE
// =============================================================================

export class AnomalyEngine extends EventEmitter<AnomalyEngineEvents> {
  private config: AnomalyConfig;
  private baselines: Map<string, AnomalyBaseline> = new Map();
  private bus?: DetectionBus;

  /** Per-source request timestamps for rate tracking */
  private requestTimestamps: Map<string, number[]> = new Map();
  /** Per-source path history for sequential detection */
  private pathHistory: Map<string, string[]> = new Map();
  /** Per-source data volume tracker */
  private volumeTracker: Map<string, number[]> = new Map();

  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<AnomalyConfig>) {
    super();
    this.config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
  }

  attach(bus: DetectionBus): void {
    this.bus = bus;
    bus.on('event:ingested', (event) => this.analyzeEvent(event));
    this.cleanupTimer = setInterval(() => this.cleanupStaleData(), 60_000);
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  analyzeEvent(event: NormalizedEvent): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const source = event.sourceIP ?? event.source;

    if (this.config.enabledTypes.includes('rate')) {
      const rateAlert = this.checkRateAnomaly(source, event);
      if (rateAlert) alerts.push(rateAlert);
    }

    if (this.config.enabledTypes.includes('pattern')) {
      const patternAlert = this.checkPatternAnomaly(source, event);
      if (patternAlert) alerts.push(patternAlert);
    }

    if (this.config.enabledTypes.includes('timing')) {
      const timingAlert = this.checkTimingAnomaly(source, event);
      if (timingAlert) alerts.push(timingAlert);
    }

    if (this.config.enabledTypes.includes('volume')) {
      const volumeAlert = this.checkVolumeAnomaly(source, event);
      if (volumeAlert) alerts.push(volumeAlert);
    }

    if (this.config.enabledTypes.includes('sequential')) {
      const seqAlert = this.checkSequentialAnomaly(source, event);
      if (seqAlert) alerts.push(seqAlert);
    }

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // Rate anomaly: requests per time window
  // ---------------------------------------------------------------------------

  private checkRateAnomaly(source: string, event: NormalizedEvent): DetectionAlert | null {
    const key = `rate:${source}`;
    let timestamps = this.requestTimestamps.get(source);
    if (!timestamps) {
      timestamps = [];
      this.requestTimestamps.set(source, timestamps);
    }

    timestamps.push(event.timestamp);

    const windowStart = event.timestamp - 60_000;
    const recentCount = timestamps.filter((t) => t >= windowStart).length;

    const baseline = this.getOrCreateBaseline(key, 'rate');
    this.updateBaseline(baseline, recentCount);

    if (!baseline.mature) return null;

    const deviation = (recentCount - baseline.mean) / (baseline.stdDev || 1);
    if (deviation < this.config.sigmaThreshold) return null;

    return this.createAnomalyAlert(
      event, 'rate', 'high',
      `Rate anomaly: ${recentCount} requests/min from ${source} (baseline: ${baseline.mean.toFixed(1)}±${baseline.stdDev.toFixed(1)})`,
      Math.min(deviation / (this.config.sigmaThreshold * 2), 1),
    );
  }

  // ---------------------------------------------------------------------------
  // Pattern anomaly: requests to sensitive/unusual paths
  // ---------------------------------------------------------------------------

  private checkPatternAnomaly(source: string, event: NormalizedEvent): DetectionAlert | null {
    if (!event.path) return null;

    const normalizedPath = event.path.toLowerCase().split('?')[0];
    const isSensitive = SENSITIVE_PATHS.some((p) => normalizedPath.startsWith(p) || normalizedPath === p);

    if (!isSensitive) return null;

    return this.createAnomalyAlert(
      event, 'pattern', 'medium',
      `Access pattern anomaly: ${source} requested sensitive path ${event.path}`,
      0.7,
    );
  }

  // ---------------------------------------------------------------------------
  // Timing anomaly: activity outside expected hours
  // ---------------------------------------------------------------------------

  private checkTimingAnomaly(source: string, event: NormalizedEvent): DetectionAlert | null {
    const key = `timing:${source}`;
    const hour = new Date(event.timestamp).getUTCHours();

    const baseline = this.getOrCreateBaseline(key, 'timing');
    this.updateBaseline(baseline, hour);

    if (!baseline.mature) return null;

    const deviation = Math.abs(hour - baseline.mean) / (baseline.stdDev || 1);
    if (deviation < this.config.sigmaThreshold) return null;

    return this.createAnomalyAlert(
      event, 'timing', 'low',
      `Timing anomaly: activity from ${source} at unusual hour ${hour}:00 UTC (baseline: ${baseline.mean.toFixed(0)}:00)`,
      Math.min(deviation / (this.config.sigmaThreshold * 2), 1),
    );
  }

  // ---------------------------------------------------------------------------
  // Volume anomaly: unusual data transfer sizes
  // ---------------------------------------------------------------------------

  private checkVolumeAnomaly(source: string, event: NormalizedEvent): DetectionAlert | null {
    const key = `volume:${source}`;
    const size = (event.data?.contentLength as number) || event.raw.length;

    let volumes = this.volumeTracker.get(source);
    if (!volumes) {
      volumes = [];
      this.volumeTracker.set(source, volumes);
    }
    volumes.push(size);

    const baseline = this.getOrCreateBaseline(key, 'volume');
    this.updateBaseline(baseline, size);

    if (!baseline.mature) return null;

    const deviation = (size - baseline.mean) / (baseline.stdDev || 1);
    if (deviation < this.config.sigmaThreshold) return null;

    return this.createAnomalyAlert(
      event, 'volume', 'high',
      `Volume anomaly: ${size} bytes from ${source} (baseline: ${baseline.mean.toFixed(0)}±${baseline.stdDev.toFixed(0)})`,
      Math.min(deviation / (this.config.sigmaThreshold * 2), 1),
    );
  }

  // ---------------------------------------------------------------------------
  // Sequential anomaly: systematic enumeration patterns
  // ---------------------------------------------------------------------------

  private checkSequentialAnomaly(source: string, event: NormalizedEvent): DetectionAlert | null {
    if (!event.path) return null;

    let paths = this.pathHistory.get(source);
    if (!paths) {
      paths = [];
      this.pathHistory.set(source, paths);
    }
    paths.push(event.path);

    if (paths.length < 5) return null;

    const recentPaths = paths.slice(-20);
    const uniqueRatio = new Set(recentPaths).size / recentPaths.length;

    if (uniqueRatio < 0.5) return null;

    const sorted = [...recentPaths].sort();
    let sequentialCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].localeCompare(sorted[i - 1]) > 0) sequentialCount++;
    }
    const sequentialRatio = sequentialCount / (sorted.length - 1);

    if (sequentialRatio < 0.7 || uniqueRatio < 0.8) return null;

    return this.createAnomalyAlert(
      event, 'sequential', 'high',
      `Sequential anomaly: systematic enumeration detected from ${source} (${recentPaths.length} unique paths, ${(sequentialRatio * 100).toFixed(0)}% sequential ordering)`,
      Math.min(sequentialRatio, 1),
    );
  }

  // ---------------------------------------------------------------------------
  // Baseline management
  // ---------------------------------------------------------------------------

  private getOrCreateBaseline(key: string, type: AnomalyType): AnomalyBaseline {
    let baseline = this.baselines.get(key);
    if (!baseline) {
      baseline = {
        source: key,
        type,
        windowMs: this.config.observationWindowMs,
        samples: [],
        mean: 0,
        stdDev: 0,
        establishedAt: Date.now(),
        updatedAt: Date.now(),
        mature: false,
        minSamples: this.config.minBaselineSamples,
      };
      this.baselines.set(key, baseline);
    }
    return baseline;
  }

  private updateBaseline(baseline: AnomalyBaseline, value: number): void {
    baseline.samples.push(value);
    baseline.updatedAt = Date.now();

    const cutoff = Date.now() - baseline.windowMs;
    baseline.samples = baseline.samples.filter((_, i) =>
      i >= baseline.samples.length - 10000
    );

    if (baseline.samples.length >= 2) {
      baseline.mean = baseline.samples.reduce((a, b) => a + b, 0) / baseline.samples.length;
      const variance = baseline.samples.reduce((sum, v) => sum + (v - baseline.mean) ** 2, 0) / baseline.samples.length;
      baseline.stdDev = Math.sqrt(variance);
    }

    const wasMature = baseline.mature;
    baseline.mature = baseline.samples.length >= baseline.minSamples;

    if (!wasMature && baseline.mature) {
      this.emit('anomaly:baseline_established', { source: baseline.source, type: baseline.type });
    } else if (baseline.mature) {
      this.emit('anomaly:baseline_updated', { source: baseline.source, type: baseline.type });
    }
  }

  getBaseline(key: string): AnomalyBaseline | undefined {
    return this.baselines.get(key);
  }

  getAllBaselines(): AnomalyBaseline[] {
    return Array.from(this.baselines.values());
  }

  getMatureBaselineCount(): number {
    return Array.from(this.baselines.values()).filter((b) => b.mature).length;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private createAnomalyAlert(
    event: NormalizedEvent,
    type: AnomalyType,
    severity: DetectionAlert['severity'],
    description: string,
    confidence: number,
  ): DetectionAlert {
    const alert: DetectionAlert = {
      id: randomUUID(),
      ruleId: `anomaly-${type}`,
      ruleName: `Anomaly: ${type}`,
      event,
      severity,
      confidence,
      detectorType: 'anomaly',
      category: 'anomaly',
      description,
      timestamp: Date.now(),
    };

    this.emit('anomaly:detected', alert);
    this.bus?.raiseAlert(alert);
    return alert;
  }

  private cleanupStaleData(): void {
    const cutoff = Date.now() - this.config.observationWindowMs;

    for (const [source, timestamps] of this.requestTimestamps) {
      const filtered = timestamps.filter((t) => t >= cutoff);
      if (filtered.length === 0) this.requestTimestamps.delete(source);
      else this.requestTimestamps.set(source, filtered);
    }

    for (const [source, paths] of this.pathHistory) {
      if (paths.length > 1000) {
        this.pathHistory.set(source, paths.slice(-500));
      }
    }

    for (const [source, volumes] of this.volumeTracker) {
      if (volumes.length > 1000) {
        this.volumeTracker.set(source, volumes.slice(-500));
      }
    }
  }
}

export function createAnomalyEngine(config?: Partial<AnomalyConfig>): AnomalyEngine {
  return new AnomalyEngine(config);
}
