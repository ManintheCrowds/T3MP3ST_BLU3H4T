/**
 * T3MP3ST BLU3H4T — Signature Matcher
 *
 * Compiles Arsenal payload databases into detection rules.
 * Each payload string becomes a regex-anchored detection pattern.
 * Matches are raised as DetectionAlerts on the bus.
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import type {
  DetectionRule,
  DetectionRuleCategory,
  DetectionAlert,
  NormalizedEvent,
} from './types.js';
import type { Severity } from '../types/index.js';
import type { DetectionBus } from './bus.js';
import type { DetectionRegistry } from './registry.js';
import {
  XSS_PAYLOADS,
  SQLI_PAYLOADS,
  SQLI_ERROR_PATTERNS,
  SSRF_PAYLOADS,
  SSRF_CLOUD_METADATA,
  LFI_PAYLOADS,
  SSTI_PAYLOADS,
  CMDI_PAYLOADS,
  XXE_PAYLOADS,
} from './payloads.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface SignatureMatcherEvents {
  'signature:matched': DetectionAlert;
  'signature:compiled': { category: string; ruleCount: number };
}

// =============================================================================
// ESCAPING UTILITY
// =============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// PAYLOAD → DETECTION RULE COMPILER
// =============================================================================

interface PayloadEntry {
  readonly payload: string;
  readonly name: string;
}

function payloadToDetectionRule(
  entry: PayloadEntry,
  category: DetectionRuleCategory,
  severity: Severity,
  mitreId?: string,
  defendId?: string,
): DetectionRule {
  return {
    id: `sig-${category}-${randomUUID().slice(0, 8)}`,
    name: `${category.toUpperCase()}: ${entry.name}`,
    pattern: new RegExp(escapeRegex(entry.payload), 'i'),
    category,
    severity,
    mitreId,
    defendId,
    description: `Detects ${entry.name} payload pattern in ${category} category`,
    enabled: true,
    tags: ['signature', category],
  };
}

function patternToDetectionRule(
  pattern: RegExp,
  name: string,
  category: DetectionRuleCategory,
  severity: Severity,
  mitreId?: string,
  defendId?: string,
): DetectionRule {
  return {
    id: `sig-${category}-${randomUUID().slice(0, 8)}`,
    name,
    pattern,
    category,
    severity,
    mitreId,
    defendId,
    description: `Detects ${name} pattern`,
    enabled: true,
    tags: ['signature', category],
  };
}

// =============================================================================
// SIGNATURE MATCHER
// =============================================================================

export class SignatureMatcher extends EventEmitter<SignatureMatcherEvents> {
  private rules: DetectionRule[] = [];
  private bus?: DetectionBus;
  private registry?: DetectionRegistry;

  /**
   * Compile all payload databases into detection rules.
   */
  compilePayloads(): DetectionRule[] {
    this.rules = [];

    // XSS — T1059.007 (JavaScript), D3-WAF
    for (const entry of XSS_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'xss', 'high', 'T1059.007', 'D3-WAF'));
    }
    this.rules.push(
      patternToDetectionRule(/<script[\s>]/i, 'Script tag open', 'xss', 'high', 'T1059.007', 'D3-WAF'),
      patternToDetectionRule(/on(error|load|click|mouseover|focus|blur|submit)\s*=/i, 'Event handler attribute', 'xss', 'high', 'T1059.007', 'D3-WAF'),
      patternToDetectionRule(/javascript\s*:/i, 'JavaScript URI scheme', 'xss', 'medium', 'T1059.007', 'D3-WAF'),
    );
    this.emit('signature:compiled', { category: 'xss', ruleCount: this.rules.length });

    // SQLi — T1190, D3-WAF
    const sqliStart = this.rules.length;
    for (const entry of SQLI_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'sqli', 'critical', 'T1190', 'D3-WAF'));
    }
    this.rules.push(
      patternToDetectionRule(/UNION\s+SELECT/i, 'UNION SELECT statement', 'sqli', 'critical', 'T1190', 'D3-WAF'),
      patternToDetectionRule(/;\s*(DROP|DELETE|INSERT|UPDATE|ALTER)\s/i, 'SQL destructive statement', 'sqli', 'critical', 'T1190', 'D3-WAF'),
      patternToDetectionRule(/WAITFOR\s+DELAY/i, 'MSSQL time-based blind', 'sqli', 'high', 'T1190', 'D3-WAF'),
      patternToDetectionRule(/SLEEP\s*\(/i, 'MySQL time-based blind', 'sqli', 'high', 'T1190', 'D3-WAF'),
      patternToDetectionRule(/OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i, 'Boolean tautology', 'sqli', 'high', 'T1190', 'D3-WAF'),
    );
    for (const errPat of SQLI_ERROR_PATTERNS) {
      this.rules.push(patternToDetectionRule(errPat, `SQL error leak: ${errPat.source}`, 'sqli', 'medium', 'T1190', 'D3-WAF'));
    }
    this.emit('signature:compiled', { category: 'sqli', ruleCount: this.rules.length - sqliStart });

    // SSRF — T1190, D3-NTA
    const ssrfStart = this.rules.length;
    for (const entry of SSRF_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'ssrf', 'high', 'T1190', 'D3-NTA'));
    }
    for (const ip of SSRF_CLOUD_METADATA) {
      this.rules.push(patternToDetectionRule(
        new RegExp(escapeRegex(ip), 'i'),
        `Cloud metadata access: ${ip}`,
        'ssrf', 'critical', 'T1190', 'D3-NTA',
      ));
    }
    this.emit('signature:compiled', { category: 'ssrf', ruleCount: this.rules.length - ssrfStart });

    // LFI — T1083 (File and Directory Discovery), D3-FA
    const lfiStart = this.rules.length;
    for (const entry of LFI_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'lfi', 'high', 'T1083', 'D3-FA'));
    }
    this.rules.push(
      patternToDetectionRule(/\.\.[\\/]\.\.[\\/]/i, 'Path traversal sequence', 'lfi', 'high', 'T1083', 'D3-FA'),
      patternToDetectionRule(/php:\/\/filter/i, 'PHP filter wrapper', 'lfi', 'critical', 'T1083', 'D3-FA'),
      patternToDetectionRule(/\/proc\/self\//i, 'Proc filesystem access', 'lfi', 'critical', 'T1083', 'D3-FA'),
    );
    this.emit('signature:compiled', { category: 'lfi', ruleCount: this.rules.length - lfiStart });

    // SSTI — T1059 (Command and Scripting Interpreter), D3-WAF
    const sstiStart = this.rules.length;
    for (const entry of SSTI_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'ssti', 'high', 'T1059', 'D3-WAF'));
    }
    this.rules.push(
      patternToDetectionRule(/\{\{.*\}\}/i, 'Template double-brace expression', 'ssti', 'medium', 'T1059', 'D3-WAF'),
      patternToDetectionRule(/<%= .*%>/i, 'ERB/JSP expression', 'ssti', 'medium', 'T1059', 'D3-WAF'),
      patternToDetectionRule(/\$\{T\(/i, 'Spring EL type expression', 'ssti', 'critical', 'T1059', 'D3-WAF'),
    );
    this.emit('signature:compiled', { category: 'ssti', ruleCount: this.rules.length - sstiStart });

    // Command injection — T1059, D3-PSA
    const cmdiStart = this.rules.length;
    for (const entry of CMDI_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'command_injection', 'critical', 'T1059', 'D3-PSA'));
    }
    this.rules.push(
      patternToDetectionRule(/;\s*(cat|ls|id|whoami|uname|pwd|curl|wget)\b/i, 'Command after semicolon', 'command_injection', 'critical', 'T1059', 'D3-PSA'),
      patternToDetectionRule(/\|\s*(cat|ls|id|whoami|uname|pwd|curl|wget)\b/i, 'Command after pipe', 'command_injection', 'critical', 'T1059', 'D3-PSA'),
      patternToDetectionRule(/`[^`]+`/, 'Backtick command substitution', 'command_injection', 'high', 'T1059', 'D3-PSA'),
      patternToDetectionRule(/\$\([^)]+\)/, 'Dollar-paren command substitution', 'command_injection', 'high', 'T1059', 'D3-PSA'),
    );
    this.emit('signature:compiled', { category: 'command_injection', ruleCount: this.rules.length - cmdiStart });

    // XXE — T1190, D3-WAF
    const xxeStart = this.rules.length;
    for (const entry of XXE_PAYLOADS) {
      this.rules.push(payloadToDetectionRule(entry, 'xxe', 'critical', 'T1190', 'D3-WAF'));
    }
    this.rules.push(
      patternToDetectionRule(/<!DOCTYPE\s+\w+\s+\[/i, 'DOCTYPE with internal subset', 'xxe', 'high', 'T1190', 'D3-WAF'),
      patternToDetectionRule(/<!ENTITY/i, 'XML entity declaration', 'xxe', 'high', 'T1190', 'D3-WAF'),
    );
    this.emit('signature:compiled', { category: 'xxe', ruleCount: this.rules.length - xxeStart });

    return this.rules;
  }

  /**
   * Wire into the detection bus and registry.
   */
  attach(bus: DetectionBus, registry: DetectionRegistry): void {
    this.bus = bus;
    this.registry = registry;

    const rules = this.compilePayloads();
    registry.addRules(rules);

    bus.on('event:ingested', (event) => this.matchEvent(event));
  }

  /**
   * Match a normalized event against all enabled signature rules.
   */
  matchEvent(event: NormalizedEvent): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const content = this.extractMatchableContent(event);

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(escapeRegex(rule.pattern as string), 'i');
      const match = pattern.exec(content);

      if (match) {
        const alert: DetectionAlert = {
          id: randomUUID(),
          ruleId: rule.id,
          ruleName: rule.name,
          event,
          severity: rule.severity,
          confidence: 0.85,
          detectorType: 'signature',
          category: rule.category,
          mitreId: rule.mitreId,
          defendId: rule.defendId,
          description: rule.description,
          timestamp: Date.now(),
          matchedContent: match[0].slice(0, 200),
        };

        alerts.push(alert);
        this.emit('signature:matched', alert);
        this.bus?.raiseAlert(alert);
      }
    }

    return alerts;
  }

  getRuleCount(): number {
    return this.rules.length;
  }

  private extractMatchableContent(event: NormalizedEvent): string {
    const parts: string[] = [];
    if (event.path) parts.push(event.path);
    if (event.body) parts.push(event.body);
    if (event.userAgent) parts.push(event.userAgent);
    if (event.raw) parts.push(event.raw);
    if (event.headers) {
      for (const v of Object.values(event.headers)) {
        parts.push(v);
      }
    }
    if (event.data) {
      parts.push(JSON.stringify(event.data));
    }
    return parts.join('\n');
  }
}

export function createSignatureMatcher(): SignatureMatcher {
  return new SignatureMatcher();
}
