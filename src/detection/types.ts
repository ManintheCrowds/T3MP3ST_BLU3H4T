/**
 * T3MP3ST BLU3H4T — Detection Engine Type Definitions
 *
 * All types for the detection subsystem: rules, alerts, events,
 * anomaly baselines, AI agent profiles, correlation, and connectors.
 */

import type { Severity } from '../types/index.js';

// =============================================================================
// DETECTION RULES
// =============================================================================

export type DetectionRuleCategory =
  | 'sqli'
  | 'xss'
  | 'ssti'
  | 'lfi'
  | 'ssrf'
  | 'xxe'
  | 'command_injection'
  | 'auth_bypass'
  | 'idor'
  | 'recon'
  | 'scanning'
  | 'enumeration'
  | 'exploitation'
  | 'lateral_movement'
  | 'exfiltration'
  | 'persistence'
  | 'credential_access'
  | 'anomaly'
  | 'ai_agent'
  | 'custom';

export type DetectorType =
  | 'signature'
  | 'attack_rule'
  | 'anomaly'
  | 'ai_detector'
  | 'correlation';

export interface DetectionRule {
  id: string;
  name: string;
  /** Regex pattern or literal string to match */
  pattern: RegExp | string;
  category: DetectionRuleCategory;
  severity: Severity;
  /** MITRE ATT&CK technique ID (e.g. T1190) */
  mitreId?: string;
  /** MITRE D3FEND countermeasure ID (e.g. D3-WAF) */
  defendId?: string;
  description: string;
  enabled: boolean;
  /** Tags for filtering and grouping */
  tags?: string[];
  /** Minimum confidence threshold (0-1) to raise an alert */
  confidenceThreshold?: number;
}

// =============================================================================
// NORMALIZED EVENTS (ingest format)
// =============================================================================

export type EventSourceType =
  | 'wazuh'
  | 'elk'
  | 'suricata'
  | 'splunk'
  | 'syslog'
  | 'access_log'
  | 'firewall'
  | 'dns'
  | 'api'
  | 'internal';

export interface NormalizedEvent {
  id: string;
  timestamp: number;
  source: string;
  sourceType: EventSourceType;
  sourceIP?: string;
  targetIP?: string;
  targetPort?: number;
  protocol?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  data: Record<string, unknown>;
  raw: string;
}

// =============================================================================
// DETECTION ALERTS
// =============================================================================

export interface DetectionAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  event: NormalizedEvent;
  severity: Severity;
  /** 0-1 confidence score */
  confidence: number;
  detectorType: DetectorType;
  category: DetectionRuleCategory;
  mitreId?: string;
  defendId?: string;
  description: string;
  timestamp: number;
  /** Matched content excerpt */
  matchedContent?: string;
}

export interface CorrelatedAlert {
  id: string;
  alerts: DetectionAlert[];
  severity: Severity;
  /** Aggregated confidence */
  confidence: number;
  sourceIP?: string;
  description: string;
  /** AI agent identified? */
  aiAgentDetected: boolean;
  frameworkId?: string;
  /** Suggested kill chain phase */
  killChainPhase?: string;
  timestamp: number;
  correlationWindowMs: number;
}

// =============================================================================
// ANOMALY ENGINE
// =============================================================================

export type AnomalyType = 'rate' | 'pattern' | 'timing' | 'volume' | 'sequential';

export interface AnomalyBaseline {
  source: string;
  type: AnomalyType;
  /** Sliding window duration in ms */
  windowMs: number;
  /** Observation data points */
  samples: number[];
  mean: number;
  stdDev: number;
  /** When baseline was established */
  establishedAt: number;
  /** Last updated */
  updatedAt: number;
  /** Whether baseline is mature enough for alerting */
  mature: boolean;
  /** Minimum samples before baseline is considered mature */
  minSamples: number;
}

export interface AnomalyConfig {
  /** Observation window for baseline establishment (ms) */
  observationWindowMs: number;
  /** Standard deviations above mean to trigger alert */
  sigmaThreshold: number;
  /** Minimum samples before alerting */
  minBaselineSamples: number;
  /** Which anomaly types to enable */
  enabledTypes: AnomalyType[];
}

// =============================================================================
// AI AGENT DETECTION
// =============================================================================

export interface AIAgentProfile {
  frameworkId: string;
  name: string;
  /** Known tool/payload signatures */
  signatures: string[];
  /** Typical inter-request timing patterns */
  timingProfile: {
    /** Expected bimodal modes: [tool_execution_ms, llm_inference_ms] */
    bimodalModes: [number, number];
    tolerance: number;
  };
  /** Kill chain phase sequence pattern */
  killChainPattern: string[];
  /** Known user agent strings */
  knownUserAgents?: string[];
}

export interface AIDetectionConfig {
  /** Require corroboration before alerting (per user decision) */
  requireCorroboration: boolean;
  /** Minimum signals before corroborated alert */
  minCorroborationSignals: number;
  /** Time window for corroboration (ms) */
  corroborationWindowMs: number;
  /** Known framework profiles */
  frameworks: AIAgentProfile[];
}

export type AISignalType =
  | 'bimodal_timing'
  | 'kill_chain_sequence'
  | 'framework_signature'
  | 'user_agent_match'
  | 'rate_anomaly'
  | 'sequential_enumeration';

export interface AIDetectionSignal {
  type: AISignalType;
  confidence: number;
  sourceIP: string;
  detail: string;
  timestamp: number;
}

// =============================================================================
// CONNECTORS
// =============================================================================

export interface ConnectorConfig {
  type: EventSourceType;
  name: string;
  enabled: boolean;
  /** Polling interval in ms (0 = streaming) */
  pollIntervalMs: number;
  /** Connection endpoint */
  endpoint: string;
  /** Credential provider key (resolved at runtime) */
  credentialKey?: string;
  /** Additional connector-specific options */
  options?: Record<string, unknown>;
}

export interface CredentialProvider {
  getCredential(key: string): Promise<{ username?: string; password?: string; token?: string; apiKey?: string }>;
}

/** Governance-stack default: reads from config or env vars */
export interface GovernanceCredentialProvider extends CredentialProvider {
  type: 'governance';
}

// =============================================================================
// DETECTION ENGINE CONFIG
// =============================================================================

export interface DetectionConfig {
  enabled: boolean;
  /** Anomaly engine configuration */
  anomaly?: Partial<AnomalyConfig>;
  /** AI agent detection configuration */
  aiDetection?: Partial<AIDetectionConfig>;
  /** SIEM connector configurations */
  connectors?: ConnectorConfig[];
  /** Correlation window in ms (default 30000) */
  correlationWindowMs?: number;
  /** Enable file-based WAL for bus persistence */
  enableWAL?: boolean;
  /** WAL file path */
  walPath?: string;
  /** Maximum events per second before backpressure (0 = unlimited) */
  maxEventsPerSecond?: number;
  /** Auto-register detection tools with Arsenal */
  registerArsenalTools?: boolean;
}

// =============================================================================
// BUS EVENTS
// =============================================================================

export interface DetectionBusEvents {
  'event:ingested': NormalizedEvent;
  'alert:raised': DetectionAlert;
  'alert:correlated': CorrelatedAlert;
  'alert:escalated': CorrelatedAlert;
  'bus:backpressure': { currentRate: number; maxRate: number };
  'bus:error': { operation: string; error: string };
}
