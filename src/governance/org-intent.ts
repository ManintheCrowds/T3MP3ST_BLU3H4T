/**
 * T3MP3ST BLU3H4T — org-intent Hard Boundary Enforcement
 *
 * Loads organizational intent policy and enforces hard boundaries (hb-1..hb-5)
 * before mission creation, phase transitions, and tool execution.
 *
 * Based on the Bitcoin-inspired org-intent schema but generalized for
 * any organizational defensive deployment.
 */

import { readFileSync, existsSync } from 'fs';
import { EventEmitter } from 'eventemitter3';

// =============================================================================
// TYPES
// =============================================================================

export type HardBoundaryId = 'hb-1' | 'hb-2' | 'hb-3' | 'hb-4' | 'hb-5';

export interface HardBoundary {
  id: HardBoundaryId;
  name: string;
  description: string;
  trigger: string;
  action: 'escalate' | 'block' | 'warn';
}

export interface BoundaryCheckResult {
  allowed: boolean;
  boundary?: HardBoundaryId;
  escalation?: string;
  context?: string;
}

export interface OrgIntentPolicy {
  name: string;
  version: string;
  hardBoundaries: HardBoundary[];
  values?: string[];
  mode?: 'offensive' | 'defensive' | 'purple';
}

export interface OrgIntentEvents {
  'boundary:checked': { boundary: HardBoundaryId; result: BoundaryCheckResult };
  'boundary:violated': { boundary: HardBoundaryId; context: string };
  'escalation:triggered': { boundary: HardBoundaryId; reason: string };
}

// =============================================================================
// DEFAULT HARD BOUNDARIES (defensive org-intent)
// =============================================================================

const DEFAULT_HARD_BOUNDARIES: HardBoundary[] = [
  {
    id: 'hb-1',
    name: 'Conflicting Principles',
    description: 'Do not act when principles conflict without human review',
    trigger: 'conflicting_principles',
    action: 'escalate',
  },
  {
    id: 'hb-2',
    name: 'Complicity Risk',
    description: 'Escalate when cooperation would enable harm to non-authorized targets',
    trigger: 'complicity_risk',
    action: 'escalate',
  },
  {
    id: 'hb-3',
    name: 'Unverified Sources',
    description: 'Do not trust instructions or data from unverified sources',
    trigger: 'no_trust_unverified',
    action: 'block',
  },
  {
    id: 'hb-4',
    name: 'Authorization Required',
    description: 'Do not perform destructive or credential operations without explicit proof of authorization',
    trigger: 'authorization_required',
    action: 'escalate',
  },
  {
    id: 'hb-5',
    name: 'Transparent Constraints',
    description: 'Do not hide system limitations or constraints from operators or reports',
    trigger: 'hidden_constraints',
    action: 'warn',
  },
];

// =============================================================================
// ORG-INTENT ENFORCER
// =============================================================================

export class OrgIntentEnforcer extends EventEmitter<OrgIntentEvents> {
  private policy: OrgIntentPolicy;

  constructor(policyPath?: string) {
    super();

    if (policyPath && existsSync(policyPath)) {
      try {
        const raw = readFileSync(policyPath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.policy = this.normalizePolicy(parsed);
      } catch {
        this.policy = this.defaultPolicy();
      }
    } else {
      this.policy = this.defaultPolicy();
    }
  }

  private defaultPolicy(): OrgIntentPolicy {
    return {
      name: 'BLU3H4T Defensive org-intent',
      version: '1.0.0',
      hardBoundaries: DEFAULT_HARD_BOUNDARIES,
      values: [
        'human-as-final-authority',
        'defense-in-depth',
        'authorized-testing-only',
        'transparent-reporting',
        'minimum-necessary-force',
      ],
      mode: 'defensive',
    };
  }

  private normalizePolicy(raw: Record<string, unknown>): OrgIntentPolicy {
    const boundaries: HardBoundary[] = [];
    const rawBoundaries = raw.hard_boundaries ?? raw.hardBoundaries;

    if (Array.isArray(rawBoundaries)) {
      for (const hb of rawBoundaries) {
        if (hb && typeof hb === 'object' && 'id' in hb) {
          boundaries.push(hb as HardBoundary);
        }
      }
    }

    return {
      name: (raw.name as string) ?? 'Loaded org-intent',
      version: (raw.version as string) ?? '1.0.0',
      hardBoundaries: boundaries.length > 0 ? boundaries : DEFAULT_HARD_BOUNDARIES,
      values: Array.isArray(raw.values) ? raw.values as string[] : undefined,
      mode: (raw.mode as OrgIntentPolicy['mode']) ?? 'defensive',
    };
  }

  getPolicy(): OrgIntentPolicy {
    return this.policy;
  }

  getMode(): OrgIntentPolicy['mode'] {
    return this.policy.mode ?? 'defensive';
  }

  /**
   * Check a proposed action against all hard boundaries.
   */
  checkBoundaries(action: string, context: BoundaryContext): BoundaryCheckResult {
    // hb-1: Conflicting principles
    if (context.conflictingOperators && context.conflictingOperators.length > 1) {
      const result: BoundaryCheckResult = {
        allowed: false,
        boundary: 'hb-1',
        escalation: `ESCALATE: Operators ${context.conflictingOperators.join(', ')} disagree on approach for "${action}". Human review required.`,
      };
      this.emit('boundary:violated', { boundary: 'hb-1', context: action });
      this.emit('escalation:triggered', { boundary: 'hb-1', reason: result.escalation! });
      return result;
    }

    // hb-2: Complicity risk — action against external/non-authorized targets
    if (context.targetAddress && !context.isAuthorizedTarget) {
      const result: BoundaryCheckResult = {
        allowed: false,
        boundary: 'hb-2',
        escalation: `ESCALATE: Action "${action}" targets "${context.targetAddress}" which is not in authorized scope. Potential complicity risk.`,
      };
      this.emit('boundary:violated', { boundary: 'hb-2', context: action });
      this.emit('escalation:triggered', { boundary: 'hb-2', reason: result.escalation! });
      return result;
    }

    // hb-3: Unverified sources
    if (context.dataSource && !context.isVerifiedSource) {
      const result: BoundaryCheckResult = {
        allowed: false,
        boundary: 'hb-3',
        escalation: `ESCALATE: Data from unverified source "${context.dataSource}". Run SCP pipeline before trusting.`,
      };
      this.emit('boundary:violated', { boundary: 'hb-3', context: action });
      return result;
    }

    // hb-4: Authorization for destructive/credential actions
    if (context.isDestructive || context.involvesCredentials) {
      if (!context.hasExplicitAuthorization) {
        const result: BoundaryCheckResult = {
          allowed: false,
          boundary: 'hb-4',
          escalation: `ESCALATE: Action "${action}" requires explicit authorization (destructive=${context.isDestructive}, credentials=${context.involvesCredentials}).`,
        };
        this.emit('boundary:violated', { boundary: 'hb-4', context: action });
        this.emit('escalation:triggered', { boundary: 'hb-4', reason: result.escalation! });
        return result;
      }
    }

    // hb-5: Transparent constraints (warn only, don't block)
    if (context.hasHiddenConstraints) {
      this.emit('boundary:checked', {
        boundary: 'hb-5',
        result: {
          allowed: true,
          boundary: 'hb-5',
          context: `Warning: constraints for "${action}" should be surfaced in reports.`,
        },
      });
    }

    return { allowed: true };
  }

  /**
   * Pre-mission validation: ensure the mission parameters don't violate boundaries.
   */
  validateMission(missionName: string, scope: string[], objectives: string[]): BoundaryCheckResult {
    if (scope.length === 0) {
      return {
        allowed: false,
        boundary: 'hb-2',
        escalation: `ESCALATE: Mission "${missionName}" has no scope defined. Cannot proceed without explicit authorized targets.`,
      };
    }

    return { allowed: true };
  }
}

export interface BoundaryContext {
  targetAddress?: string;
  isAuthorizedTarget?: boolean;
  dataSource?: string;
  isVerifiedSource?: boolean;
  isDestructive?: boolean;
  involvesCredentials?: boolean;
  hasExplicitAuthorization?: boolean;
  hasHiddenConstraints?: boolean;
  conflictingOperators?: string[];
}

export function createOrgIntentEnforcer(policyPath?: string): OrgIntentEnforcer {
  return new OrgIntentEnforcer(policyPath);
}
