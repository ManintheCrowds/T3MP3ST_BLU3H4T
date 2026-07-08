/**
 * T3MP3ST BLU3H4T — Risk Tier Classification & Gate Enforcement
 *
 * Replaces Tempest's flat "authorized use only" model with graduated
 * access control aligned to the org-intent hard boundaries.
 *
 * Tier mapping:
 *   Low  — passive/read-only tools, no gate
 *   Med  — active network probes, scope-check gate
 *   High — exploitation/credential tools, APPROVAL_NEEDED gate
 */

import { EventEmitter } from 'eventemitter3';
import { isTargetInAuthorizedScope } from './scope-match.js';

// =============================================================================
// TYPES
// =============================================================================

export type RiskTier = 'low' | 'med' | 'high';

export interface RiskGateResult {
  allowed: boolean;
  tier: RiskTier;
  reason?: string;
  requiresApproval: boolean;
}

export interface RiskTierEvents {
  'gate:passed': { tool: string; tier: RiskTier };
  'gate:blocked': { tool: string; tier: RiskTier; reason: string };
  'gate:approval_needed': { tool: string; tier: RiskTier; action: string };
}

export interface AuditEntry {
  timestamp: string;
  tool: string;
  tier: RiskTier;
  action: string;
  outcome: 'allowed' | 'blocked' | 'pending_approval';
  scope?: string;
}

// =============================================================================
// TOOL RISK CLASSIFICATION
// =============================================================================

const TOOL_RISK_MAP: Record<string, RiskTier> = {
  // Low tier — passive, read-only, no network modification
  dns_lookup: 'low',
  whois_lookup: 'low',
  header_analysis: 'low',
  technology_detect: 'low',
  base64_decode: 'low',
  jwt_decode: 'low',
  ssl_scan: 'low',
  reverse_dns: 'low',
  csp_analysis: 'low',

  // Med tier — active network probes, requires scope check
  port_scan: 'med',
  subdomain_enum: 'med',
  dir_bruteforce: 'med',
  http_request: 'med',
  nmap_scan: 'med',
  cors_check: 'med',
  http_methods_test: 'med',
  api_endpoint_discovery: 'med',
  nuclei_scan: 'med',

  // High tier — exploitation/credential tools, requires human approval
  xss_scan: 'high',
  sqli_scan: 'high',
  ssti_test: 'high',
  lfi_test: 'high',
  password_spray: 'high',
  hash_crack: 'high',
  open_redirect_test: 'high',
  ffuf_fuzz: 'high',
};

// =============================================================================
// RISK TIER GATE
// =============================================================================

export class RiskTierGate extends EventEmitter<RiskTierEvents> {
  private authorizedScope: Set<string> = new Set();
  private auditLog: AuditEntry[] = [];
  private pendingApprovals: Map<string, { resolve: (approved: boolean) => void }> = new Map();

  constructor(initialScope?: string[]) {
    super();
    if (initialScope) {
      initialScope.forEach((s) => this.authorizedScope.add(s));
    }
  }

  getToolTier(toolName: string): RiskTier {
    return TOOL_RISK_MAP[toolName] ?? 'high';
  }

  addToScope(target: string): void {
    this.authorizedScope.add(target);
  }

  removeFromScope(target: string): void {
    this.authorizedScope.delete(target);
  }

  getAuthorizedScope(): string[] {
    return Array.from(this.authorizedScope);
  }

  isInScope(target: string): boolean {
    return isTargetInAuthorizedScope(target, this.getAuthorizedScope());
  }

  async checkGate(toolName: string, targetAddress?: string): Promise<RiskGateResult> {
    const tier = this.getToolTier(toolName);

    switch (tier) {
      case 'low': {
        this.logAudit(toolName, tier, 'execute', 'allowed');
        this.emit('gate:passed', { tool: toolName, tier });
        return { allowed: true, tier, requiresApproval: false };
      }

      case 'med': {
        if (targetAddress && !this.isInScope(targetAddress)) {
          const reason = `Target "${targetAddress}" not in authorized scope`;
          this.logAudit(toolName, tier, `scope-check: ${targetAddress}`, 'blocked');
          this.emit('gate:blocked', { tool: toolName, tier, reason });
          return { allowed: false, tier, reason, requiresApproval: false };
        }
        this.logAudit(toolName, tier, 'execute', 'allowed');
        this.emit('gate:passed', { tool: toolName, tier });
        return { allowed: true, tier, requiresApproval: false };
      }

      case 'high': {
        this.logAudit(toolName, tier, 'execute', 'pending_approval');
        this.emit('gate:approval_needed', {
          tool: toolName,
          tier,
          action: `Execute ${toolName}${targetAddress ? ` against ${targetAddress}` : ''}`,
        });
        return { allowed: false, tier, requiresApproval: true, reason: 'APPROVAL_NEEDED' };
      }

      default: {
        const _exhaustive: never = tier;
        return _exhaustive;
      }
    }
  }

  approveExecution(toolName: string): void {
    const pending = this.pendingApprovals.get(toolName);
    if (pending) {
      pending.resolve(true);
      this.pendingApprovals.delete(toolName);
    }
  }

  denyExecution(toolName: string): void {
    const pending = this.pendingApprovals.get(toolName);
    if (pending) {
      pending.resolve(false);
      this.pendingApprovals.delete(toolName);
    }
  }

  getAuditLog(): readonly AuditEntry[] {
    return this.auditLog;
  }

  private logAudit(tool: string, tier: RiskTier, action: string, outcome: AuditEntry['outcome'], scope?: string): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      tool,
      tier,
      action,
      outcome,
      scope,
    });
  }
}

export function createRiskTierGate(scope?: string[]): RiskTierGate {
  return new RiskTierGate(scope);
}
