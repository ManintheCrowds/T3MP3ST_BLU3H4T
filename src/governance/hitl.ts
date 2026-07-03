/**
 * T3MP3ST BLU3H4T — Human-in-the-Loop (HITL) Gate System
 *
 * Provides structured human gates for the defensive platform:
 *   APPROVAL_NEEDED — pause and wait for human confirmation
 *   ESCALATE        — halt on boundary violation, require human decision
 *   REQUEST_HUMAN   — pause for guidance when agent is uncertain
 *
 * Integrates with the EventEmitter-based architecture so the War Room UI
 * and CLI can surface approval requests to operators.
 */

import { EventEmitter } from 'eventemitter3';
import type { RiskTier } from './risk-tiers.js';

// =============================================================================
// TYPES
// =============================================================================

export type HITLGateType = 'approval_needed' | 'escalation' | 'request_human';

export type HITLStatus = 'pending' | 'approved' | 'denied' | 'timeout';

export interface HITLRequest {
  id: string;
  type: HITLGateType;
  operatorId: string;
  operatorArchetype: string;
  tool?: string;
  action: string;
  riskTier?: RiskTier;
  boundary?: string;
  context?: string;
  status: HITLStatus;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface HITLEvents {
  'governance:approval_needed': { request: HITLRequest };
  'governance:escalation': { request: HITLRequest };
  'governance:request_human': { request: HITLRequest };
  'governance:approved': { request: HITLRequest; approver: string };
  'governance:denied': { request: HITLRequest; reason?: string };
  'governance:timeout': { request: HITLRequest };
}

export interface HITLConfig {
  /** Timeout in ms before an unanswered request is auto-denied. 0 = no timeout. */
  requestTimeoutMs: number;
  /** If true, auto-approve Low-tier requests without human confirmation */
  autoApproveLow: boolean;
}

// =============================================================================
// HITL GATE MANAGER
// =============================================================================

export class HITLGateManager extends EventEmitter<HITLEvents> {
  private pendingRequests: Map<string, HITLRequest> = new Map();
  private resolvedRequests: HITLRequest[] = [];
  private config: HITLConfig;
  private requestCounter = 0;

  constructor(config?: Partial<HITLConfig>) {
    super();
    this.config = {
      requestTimeoutMs: 0,
      autoApproveLow: true,
      ...config,
    };
  }

  /**
   * Request approval before executing a High-risk tool.
   * Returns a Promise that resolves when the human responds.
   */
  async requestApproval(
    operatorId: string,
    operatorArchetype: string,
    tool: string,
    action: string,
    riskTier: RiskTier,
  ): Promise<boolean> {
    if (this.config.autoApproveLow && riskTier === 'low') {
      return true;
    }

    const request = this.createRequest('approval_needed', operatorId, operatorArchetype, {
      tool,
      action,
      riskTier,
    });

    this.emit('governance:approval_needed', { request });

    return this.waitForResolution(request);
  }

  /**
   * Escalate a boundary violation. Halts the operator until human decides.
   */
  async escalate(
    operatorId: string,
    operatorArchetype: string,
    boundary: string,
    context: string,
  ): Promise<boolean> {
    const request = this.createRequest('escalation', operatorId, operatorArchetype, {
      action: `Boundary violation: ${boundary}`,
      boundary,
      context,
    });

    this.emit('governance:escalation', { request });

    return this.waitForResolution(request);
  }

  /**
   * Request human guidance when the agent is uncertain.
   */
  async requestGuidance(
    operatorId: string,
    operatorArchetype: string,
    question: string,
  ): Promise<boolean> {
    const request = this.createRequest('request_human', operatorId, operatorArchetype, {
      action: question,
      context: 'Agent requires human guidance',
    });

    this.emit('governance:request_human', { request });

    return this.waitForResolution(request);
  }

  /**
   * Human approves a pending request.
   */
  approve(requestId: string, approver: string = 'human'): void {
    const request = this.pendingRequests.get(requestId);
    if (!request) return;

    request.status = 'approved';
    request.resolvedAt = Date.now();
    request.resolvedBy = approver;

    this.pendingRequests.delete(requestId);
    this.resolvedRequests.push(request);

    this.emit('governance:approved', { request, approver });
  }

  /**
   * Human denies a pending request.
   */
  deny(requestId: string, reason?: string): void {
    const request = this.pendingRequests.get(requestId);
    if (!request) return;

    request.status = 'denied';
    request.resolvedAt = Date.now();

    this.pendingRequests.delete(requestId);
    this.resolvedRequests.push(request);

    this.emit('governance:denied', { request, reason });
  }

  getPendingRequests(): HITLRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  getResolvedRequests(): readonly HITLRequest[] {
    return this.resolvedRequests;
  }

  hasPendingRequests(): boolean {
    return this.pendingRequests.size > 0;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private createRequest(
    type: HITLGateType,
    operatorId: string,
    operatorArchetype: string,
    fields: Partial<HITLRequest>,
  ): HITLRequest {
    const id = `hitl-${++this.requestCounter}-${Date.now()}`;
    const request: HITLRequest = {
      id,
      type,
      operatorId,
      operatorArchetype,
      action: fields.action ?? 'unknown',
      status: 'pending',
      createdAt: Date.now(),
      ...fields,
    };
    this.pendingRequests.set(id, request);
    return request;
  }

  private waitForResolution(request: HITLRequest): Promise<boolean> {
    return new Promise((resolve) => {
      const checkResolved = () => {
        if (request.status === 'approved') {
          resolve(true);
          return;
        }
        if (request.status === 'denied' || request.status === 'timeout') {
          resolve(false);
          return;
        }
        // Check timeout
        if (this.config.requestTimeoutMs > 0) {
          const elapsed = Date.now() - request.createdAt;
          if (elapsed > this.config.requestTimeoutMs) {
            request.status = 'timeout';
            request.resolvedAt = Date.now();
            this.pendingRequests.delete(request.id);
            this.resolvedRequests.push(request);
            this.emit('governance:timeout', { request });
            resolve(false);
            return;
          }
        }
        setTimeout(checkResolved, 500);
      };

      // Start polling after a tick to allow event listeners to fire
      setTimeout(checkResolved, 100);
    });
  }
}

export function createHITLGateManager(config?: Partial<HITLConfig>): HITLGateManager {
  return new HITLGateManager(config);
}
