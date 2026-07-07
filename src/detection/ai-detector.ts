/**
 * T3MP3ST BLU3H4T — AI Agent Detector
 *
 * Detects autonomous AI red team agents by analyzing:
 *  - ReAct loop fingerprinting (bimodal inter-request timing)
 *  - Kill chain sequencing (framework phase-model matching)
 *  - Framework identification (tool/payload signature matching)
 *  - Corroboration gate (waits for multiple signals before alerting)
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import type {
  AIDetectionConfig,
  AIDetectionSignal,
  AIAgentProfile,
  DetectionAlert,
  NormalizedEvent,
} from './types.js';
import type { DetectionBus } from './bus.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface AIDetectorEvents {
  'ai:signal_detected': AIDetectionSignal;
  'ai:agent_confirmed': DetectionAlert;
  'ai:framework_identified': { frameworkId: string; confidence: number; sourceIP: string };
}

// =============================================================================
// KNOWN FRAMEWORK PROFILES
// =============================================================================

const DEFAULT_FRAMEWORK_PROFILES: AIAgentProfile[] = [
  {
    frameworkId: 'tempest',
    name: 'T3MP3ST BLU3H4T',
    signatures: ['xss_scan', 'sqli_scan', 'ssrf_scan', 'lfi_scan', 'ssti_scan', 'subdomain_enum', 'dir_bruteforce', 'nuclei'],
    timingProfile: { bimodalModes: [100, 3000], tolerance: 0.5 },
    killChainPattern: ['recon', 'scanning', 'enumeration', 'exploitation', 'post-exploitation'],
    knownUserAgents: ['T3MP3ST', 'tempest-agent'],
  },
  {
    frameworkId: 'pentestgpt',
    name: 'PentestGPT',
    signatures: ['pentest', 'gpt-driven', 'structured-output'],
    timingProfile: { bimodalModes: [200, 5000], tolerance: 0.5 },
    killChainPattern: ['reconnaissance', 'scanning', 'gaining-access', 'maintaining-access'],
  },
  {
    frameworkId: 'autoexploit',
    name: 'AutoExploit',
    signatures: ['metasploit', 'msfconsole', 'exploit/multi', 'payload/'],
    timingProfile: { bimodalModes: [50, 2000], tolerance: 0.4 },
    killChainPattern: ['scan', 'exploit', 'post'],
  },
  {
    frameworkId: 'nuclei',
    name: 'Nuclei Scanner',
    signatures: ['nuclei', 'projectdiscovery', 'template-id:', 'severity:'],
    timingProfile: { bimodalModes: [10, 500], tolerance: 0.3 },
    killChainPattern: ['scan'],
    knownUserAgents: ['Nuclei', 'nuclei/'],
  },
  {
    frameworkId: 'generic-llm-agent',
    name: 'Generic LLM Agent',
    signatures: [],
    timingProfile: { bimodalModes: [100, 3000], tolerance: 0.6 },
    killChainPattern: ['observe', 'think', 'act'],
  },
];

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_AI_CONFIG: AIDetectionConfig = {
  requireCorroboration: true,
  minCorroborationSignals: 2,
  corroborationWindowMs: 120_000,
  frameworks: DEFAULT_FRAMEWORK_PROFILES,
};

// =============================================================================
// AI AGENT DETECTOR
// =============================================================================

export class AIAgentDetector extends EventEmitter<AIDetectorEvents> {
  private config: AIDetectionConfig;
  private bus?: DetectionBus;

  /** Per-source inter-request timestamps */
  private requestTimings: Map<string, number[]> = new Map();
  /** Per-source accumulated detection signals */
  private pendingSignals: Map<string, AIDetectionSignal[]> = new Map();
  /** Per-source phase history for kill chain detection */
  private phaseHistory: Map<string, string[]> = new Map();
  /** Sources already confirmed as AI agents */
  private confirmedAgents: Set<string> = new Set();

  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<AIDetectionConfig>) {
    super();
    this.config = {
      ...DEFAULT_AI_CONFIG,
      ...config,
      frameworks: [
        ...DEFAULT_FRAMEWORK_PROFILES,
        ...(config?.frameworks ?? []),
      ],
    };
  }

  attach(bus: DetectionBus): void {
    this.bus = bus;
    bus.on('event:ingested', (event) => this.analyzeEvent(event));
    this.cleanupTimer = setInterval(() => this.cleanupStaleSignals(), 60_000);
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  analyzeEvent(event: NormalizedEvent): DetectionAlert | null {
    const source = event.sourceIP ?? event.source;

    if (this.confirmedAgents.has(source)) {
      return this.createAIAlert(event, source, 1.0, 'Previously confirmed AI agent');
    }

    this.recordTiming(source, event.timestamp);

    const signals: AIDetectionSignal[] = [];

    const timingSignal = this.checkBimodalTiming(source);
    if (timingSignal) signals.push(timingSignal);

    const uaSignal = this.checkUserAgent(source, event);
    if (uaSignal) signals.push(uaSignal);

    const fwSignal = this.checkFrameworkSignatures(source, event);
    if (fwSignal) signals.push(fwSignal);

    const seqSignal = this.checkKillChainSequence(source, event);
    if (seqSignal) signals.push(seqSignal);

    const rateSignal = this.checkRapidProbing(source);
    if (rateSignal) signals.push(rateSignal);

    for (const signal of signals) {
      this.addSignal(source, signal);
      this.emit('ai:signal_detected', signal);
    }

    return this.evaluateCorroboration(source, event);
  }

  // ---------------------------------------------------------------------------
  // ReAct loop fingerprinting (bimodal timing)
  // ---------------------------------------------------------------------------

  private recordTiming(source: string, timestamp: number): void {
    let timings = this.requestTimings.get(source);
    if (!timings) {
      timings = [];
      this.requestTimings.set(source, timings);
    }
    timings.push(timestamp);
    if (timings.length > 200) {
      this.requestTimings.set(source, timings.slice(-100));
    }
  }

  private checkBimodalTiming(source: string): AIDetectionSignal | null {
    const timings = this.requestTimings.get(source);
    if (!timings || timings.length < 10) return null;

    const intervals: number[] = [];
    for (let i = 1; i < timings.length; i++) {
      intervals.push(timings[i] - timings[i - 1]);
    }

    const shortThreshold = 500;
    const longMin = 1000;
    const longMax = 10000;

    const shortIntervals = intervals.filter((d) => d < shortThreshold);
    const longIntervals = intervals.filter((d) => d >= longMin && d <= longMax);

    const shortRatio = shortIntervals.length / intervals.length;
    const longRatio = longIntervals.length / intervals.length;

    if (shortRatio > 0.3 && longRatio > 0.2 && shortRatio + longRatio > 0.6) {
      return {
        type: 'bimodal_timing',
        confidence: Math.min(shortRatio + longRatio, 1),
        sourceIP: source,
        detail: `Bimodal timing: ${(shortRatio * 100).toFixed(0)}% short (<${shortThreshold}ms), ${(longRatio * 100).toFixed(0)}% long (${longMin}-${longMax}ms) — characteristic of ReAct loop`,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // User agent matching
  // ---------------------------------------------------------------------------

  private checkUserAgent(source: string, event: NormalizedEvent): AIDetectionSignal | null {
    if (!event.userAgent) return null;

    for (const fw of this.config.frameworks) {
      if (!fw.knownUserAgents) continue;
      for (const ua of fw.knownUserAgents) {
        if (event.userAgent.includes(ua)) {
          this.emit('ai:framework_identified', { frameworkId: fw.frameworkId, confidence: 0.9, sourceIP: source });
          return {
            type: 'user_agent_match',
            confidence: 0.9,
            sourceIP: source,
            detail: `User-Agent matches known AI framework: ${fw.name} (UA: ${event.userAgent})`,
            timestamp: Date.now(),
          };
        }
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Framework signature matching
  // ---------------------------------------------------------------------------

  private checkFrameworkSignatures(source: string, event: NormalizedEvent): AIDetectionSignal | null {
    const content = [event.raw, event.path ?? '', event.body ?? '', JSON.stringify(event.data)].join('\n').toLowerCase();

    for (const fw of this.config.frameworks) {
      if (fw.signatures.length === 0) continue;

      const matched = fw.signatures.filter((sig) => content.includes(sig.toLowerCase()));
      if (matched.length >= 2) {
        this.emit('ai:framework_identified', { frameworkId: fw.frameworkId, confidence: 0.8, sourceIP: source });
        return {
          type: 'framework_signature',
          confidence: Math.min(0.5 + matched.length * 0.15, 1),
          sourceIP: source,
          detail: `Framework signatures matched: ${fw.name} (${matched.join(', ')})`,
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Kill chain sequence detection
  // ---------------------------------------------------------------------------

  private checkKillChainSequence(source: string, event: NormalizedEvent): AIDetectionSignal | null {
    const phase = this.classifyPhase(event);
    if (!phase) return null;

    let history = this.phaseHistory.get(source);
    if (!history) {
      history = [];
      this.phaseHistory.set(source, history);
    }
    history.push(phase);

    if (history.length < 3) return null;

    const recentPhases = history.slice(-10);

    for (const fw of this.config.frameworks) {
      const matchScore = this.matchPhaseSequence(recentPhases, fw.killChainPattern);
      if (matchScore > 0.5) {
        return {
          type: 'kill_chain_sequence',
          confidence: matchScore,
          sourceIP: source,
          detail: `Kill chain sequence matches ${fw.name}: ${recentPhases.join(' → ')}`,
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  private classifyPhase(event: NormalizedEvent): string | null {
    const content = [event.raw, event.path ?? '', JSON.stringify(event.data)].join('\n').toLowerCase();

    if (/dns|whois|subdomain|nslookup/i.test(content)) return 'recon';
    if (/scan|probe|nmap|masscan/i.test(content)) return 'scanning';
    if (/enum|brute|fuzz|dirb|gobuster/i.test(content)) return 'enumeration';
    if (/exploit|inject|payload|shell|rce/i.test(content)) return 'exploitation';
    if (/persist|backdoor|webshell|cron|scheduled/i.test(content)) return 'post-exploitation';
    if (/exfil|transfer|download|upload.*dump/i.test(content)) return 'exfiltration';

    return null;
  }

  private matchPhaseSequence(observed: string[], expected: string[]): number {
    if (expected.length === 0) return 0;

    let matched = 0;
    let expectedIdx = 0;

    for (const phase of observed) {
      if (expectedIdx < expected.length && phase === expected[expectedIdx]) {
        matched++;
        expectedIdx++;
      }
    }

    return matched / expected.length;
  }

  // ---------------------------------------------------------------------------
  // Rapid probing detection
  // ---------------------------------------------------------------------------

  private checkRapidProbing(source: string): AIDetectionSignal | null {
    const timings = this.requestTimings.get(source);
    if (!timings || timings.length < 10) return null;

    const windowStart = Date.now() - 5000;
    const recentCount = timings.filter((t) => t >= windowStart).length;

    if (recentCount > 10) {
      return {
        type: 'rate_anomaly',
        confidence: Math.min(recentCount / 20, 1),
        sourceIP: source,
        detail: `Rapid probing: ${recentCount} requests in 5 seconds from ${source}`,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Corroboration gate
  // ---------------------------------------------------------------------------

  private addSignal(source: string, signal: AIDetectionSignal): void {
    let signals = this.pendingSignals.get(source);
    if (!signals) {
      signals = [];
      this.pendingSignals.set(source, signals);
    }
    signals.push(signal);
  }

  private evaluateCorroboration(source: string, event: NormalizedEvent): DetectionAlert | null {
    const signals = this.pendingSignals.get(source);
    if (!signals || signals.length === 0) return null;

    const windowStart = Date.now() - this.config.corroborationWindowMs;
    const recentSignals = signals.filter((s) => s.timestamp >= windowStart);

    if (!this.config.requireCorroboration) {
      if (recentSignals.length > 0) {
        const best = recentSignals.reduce((a, b) => (a.confidence > b.confidence ? a : b));
        return this.createAIAlert(event, source, best.confidence, best.detail);
      }
      return null;
    }

    const signalTypes = new Set(recentSignals.map((s) => s.type));
    if (signalTypes.size < this.config.minCorroborationSignals) return null;

    const avgConfidence = recentSignals.reduce((sum, s) => sum + s.confidence, 0) / recentSignals.length;
    const boostedConfidence = Math.min(avgConfidence * (1 + signalTypes.size * 0.1), 1);

    this.confirmedAgents.add(source);
    this.pendingSignals.delete(source);

    const frameworkIds = recentSignals
      .filter((s) => s.type === 'framework_signature' || s.type === 'user_agent_match')
      .map((s) => s.detail);

    const description = [
      `AI agent detected from ${source}`,
      `${signalTypes.size} signal types corroborated: ${Array.from(signalTypes).join(', ')}`,
      frameworkIds.length > 0 ? `Framework: ${frameworkIds[0]}` : '',
    ].filter(Boolean).join('. ');

    return this.createAIAlert(event, source, boostedConfidence, description);
  }

  private createAIAlert(
    event: NormalizedEvent,
    _source: string,
    confidence: number,
    description: string,
  ): DetectionAlert {
    const alert: DetectionAlert = {
      id: randomUUID(),
      ruleId: 'ai-agent-detector',
      ruleName: 'AI Agent Detector',
      event,
      severity: confidence > 0.8 ? 'critical' : 'high',
      confidence,
      detectorType: 'ai_detector',
      category: 'ai_agent',
      description,
      timestamp: Date.now(),
    };

    this.emit('ai:agent_confirmed', alert);
    this.bus?.raiseAlert(alert);
    return alert;
  }

  // ---------------------------------------------------------------------------
  // Management
  // ---------------------------------------------------------------------------

  isConfirmedAgent(source: string): boolean {
    return this.confirmedAgents.has(source);
  }

  getConfirmedAgents(): string[] {
    return Array.from(this.confirmedAgents);
  }

  getPendingSignals(source: string): AIDetectionSignal[] {
    return this.pendingSignals.get(source) ?? [];
  }

  getStats(): { confirmedAgents: number; pendingSources: number; totalSignals: number } {
    let totalSignals = 0;
    for (const signals of this.pendingSignals.values()) {
      totalSignals += signals.length;
    }
    return {
      confirmedAgents: this.confirmedAgents.size,
      pendingSources: this.pendingSignals.size,
      totalSignals,
    };
  }

  private cleanupStaleSignals(): void {
    const cutoff = Date.now() - this.config.corroborationWindowMs * 2;
    for (const [source, signals] of this.pendingSignals) {
      const filtered = signals.filter((s) => s.timestamp >= cutoff);
      if (filtered.length === 0) this.pendingSignals.delete(source);
      else this.pendingSignals.set(source, filtered);
    }
  }
}

export function createAIAgentDetector(config?: Partial<AIDetectionConfig>): AIAgentDetector {
  return new AIAgentDetector(config);
}
