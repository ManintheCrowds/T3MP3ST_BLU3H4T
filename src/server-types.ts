/**
 * Narrow API types for Express route handlers (server.ts bounded typing pass).
 */
import type { LLMConfig, LLMProvider, OperatorArchetype } from './types/index.js';

export type GuardAction =
  | 'command_execution'
  | 'network_request'
  | 'mission_execution'
  | 'autonomous_execution'
  | 'model_call';

export interface MissionFindingLedgerInput {
  id?: string;
  title?: string;
  description?: string;
  severity?: unknown;
  targetId?: string;
}

export interface ApprovalRequestBody {
  action?: string;
  target?: unknown;
  reason?: string;
  source?: string;
  operationDraft?: OperationDraftBody;
  approvalId?: string;
}

export interface ApprovalDecisionBody {
  ttlMinutes?: number;
  approvedBy?: string;
}

export interface ApiErrorResponse {
  error: string;
  next?: string;
  action?: string;
  target?: string;
}

export interface OperationDraftScope {
  authorized?: boolean;
  allowed_actions?: unknown[];
}

export interface OperationDraftBody {
  operation_id?: string;
  scope?: OperationDraftScope;
}

export interface GeneralLlmRouteConfig {
  apiKey?: string;
  provider: LLMProvider;
  model: string;
}

const LLM_PROVIDERS: readonly LLMProvider[] = [
  'openrouter',
  'venice',
  'anthropic',
  'openai',
  'codex',
  'mock',
  'local',
  'local-agent',
];

export function isLLMProvider(value: string): value is LLMProvider {
  return (LLM_PROVIDERS as readonly string[]).includes(value);
}

export function parseLLMProvider(value: string, fallback: LLMProvider = 'openrouter'): LLMProvider {
  return isLLMProvider(value) ? value : fallback;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

export function execFailureOutput(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'stdout' in error) {
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === 'string') return stdout;
  }
  return '';
}

export function readOperationDraft(body: Record<string, unknown>): OperationDraftBody | undefined {
  const draft = body.operationDraft;
  if (!draft || typeof draft !== 'object') return undefined;
  return draft as OperationDraftBody;
}

export function isOperatorArchetype(value: string): value is OperatorArchetype {
  const valid: OperatorArchetype[] = [
    'recon',
    'scanner',
    'exploiter',
    'infiltrator',
    'exfiltrator',
    'ghost',
    'coordinator',
    'analyst',
  ];
  return valid.includes(value as OperatorArchetype);
}

export type ResolvedGeneralLlmConfig = Pick<
  LLMConfig,
  'provider' | 'model' | 'apiKey' | 'maxTokens' | 'temperature' | 'timeout'
>;

export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  return { value };
}

export function bountyCredentialsConfigured(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return Boolean(rec.apiKey || rec.apiIdentifier || rec.walletAddress);
}
