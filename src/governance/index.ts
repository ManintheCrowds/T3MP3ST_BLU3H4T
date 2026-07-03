/**
 * T3MP3ST BLU3H4T — Governance Module
 *
 * The governance layer that pure offensive frameworks lack.
 * Composes: SCP content gates + org-intent boundaries + HITL gates + risk tiers.
 */

export { SCPClient, createSCPClient } from './scp-client.js';
export type { SCPTier, SCPSink, SCPInspectResult, SCPPipelineResult, SCPFinding, SCPClientConfig } from './scp-client.js';

export { OrgIntentEnforcer, createOrgIntentEnforcer } from './org-intent.js';
export type { HardBoundaryId, HardBoundary, BoundaryCheckResult, OrgIntentPolicy, BoundaryContext } from './org-intent.js';

export { HITLGateManager, createHITLGateManager } from './hitl.js';
export type { HITLGateType, HITLStatus, HITLRequest, HITLConfig } from './hitl.js';

export { RiskTierGate, createRiskTierGate } from './risk-tiers.js';
export type { RiskTier, RiskGateResult, AuditEntry } from './risk-tiers.js';

// =============================================================================
// COMPOSED GOVERNANCE STACK
// =============================================================================

import { SCPClient, type SCPClientConfig } from './scp-client.js';
import { OrgIntentEnforcer } from './org-intent.js';
import { HITLGateManager, type HITLConfig } from './hitl.js';
import { RiskTierGate } from './risk-tiers.js';

export interface GovernanceStackConfig {
  scp?: Partial<SCPClientConfig>;
  hitl?: Partial<HITLConfig>;
  orgIntentPath?: string;
  authorizedScope?: string[];
}

export interface GovernanceStack {
  scp: SCPClient;
  orgIntent: OrgIntentEnforcer;
  hitl: HITLGateManager;
  riskTiers: RiskTierGate;
}

/**
 * Create the full governance stack in one call.
 *
 * Usage:
 *   const gov = createGovernanceStack({ authorizedScope: ['10.0.0.0/24'] });
 *   // Gate tool output
 *   const result = await gov.scp.runPipeline(toolOutput, 'tool_output');
 *   // Check org-intent before mission
 *   const boundary = gov.orgIntent.checkBoundaries('start_mission', ctx);
 *   // Request human approval for high-risk tool
 *   const approved = await gov.hitl.requestApproval(opId, 'validator', 'sqli_scan', 'Test SQL injection', 'high');
 *   // Check risk tier
 *   const gate = await gov.riskTiers.checkGate('port_scan', '10.0.0.1');
 */
export function createGovernanceStack(config?: GovernanceStackConfig): GovernanceStack {
  return {
    scp: new SCPClient(config?.scp),
    orgIntent: new OrgIntentEnforcer(config?.orgIntentPath),
    hitl: new HITLGateManager(config?.hitl),
    riskTiers: new RiskTierGate(config?.authorizedScope),
  };
}
