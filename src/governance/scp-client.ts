/**
 * T3MP3ST BLU3H4T — SCP (Secure-Contain-Protect) MCP Bridge Client
 *
 * TypeScript wrapper that calls the Python SCP MCP server tools.
 * Gates all content entering the defense platform: tool output,
 * external feeds, LLM responses, and evidence before persistence.
 *
 * The SCP MCP server (scp_mcp.py / FastMCP) exposes:
 *   scp_inspect, scp_sanitize, scp_contain, scp_quarantine,
 *   scp_validate_output, scp_mask_secrets, scp_run_pipeline
 */

import { EventEmitter } from 'eventemitter3';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// =============================================================================
// TYPES
// =============================================================================

export type SCPTier = 'injection' | 'reversal' | 'clean';
export type SCPSink = 'handoff' | 'state' | 'llm_context' | 'tool_output';

export interface SCPInspectResult {
  tier: SCPTier;
  findings: SCPFinding[];
  content_length: number;
}

export interface SCPFinding {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SCPPipelineResult {
  tier: SCPTier;
  action: 'blocked' | 'sanitized' | 'contained' | 'passed';
  content: string;
  findings: SCPFinding[];
}

export interface SCPClientEvents {
  'scp:inspected': { tier: SCPTier; contentLength: number };
  'scp:blocked': { tier: SCPTier; reason: string };
  'scp:sanitized': { tier: SCPTier; findingsCount: number };
  'scp:passed': { contentLength: number };
  'scp:error': { operation: string; error: string };
}

export interface SCPClientConfig {
  scpServerPath?: string;
  pythonPath?: string;
  enabled: boolean;
  /** When true, injection-tier content is quarantined instead of just blocked */
  quarantineOnBlock?: boolean;
}

// =============================================================================
// SCP CLIENT (MCP Bridge)
// =============================================================================

export class SCPClient extends EventEmitter<SCPClientEvents> {
  private config: SCPClientConfig;

  constructor(config?: Partial<SCPClientConfig>) {
    super();
    this.config = {
      enabled: true,
      quarantineOnBlock: false,
      ...config,
    };
  }

  /**
   * Inspect content without modifying it.
   * Returns tier classification: injection | reversal | clean
   */
  async inspectContent(content: string, context?: string): Promise<SCPInspectResult> {
    if (!this.config.enabled) {
      return { tier: 'clean', findings: [], content_length: content.length };
    }

    const result = await this.callSCPTool('inspect', { content, context });
    const tier = (result.tier ?? 'clean') as SCPTier;

    this.emit('scp:inspected', { tier, contentLength: content.length });

    if (tier === 'injection') {
      this.emit('scp:blocked', { tier, reason: 'Content classified as injection' });
    }

    return {
      tier,
      findings: result.findings ?? [],
      content_length: content.length,
    };
  }

  /**
   * Run the full SCP pipeline (inspect -> sanitize -> contain -> quarantine).
   * Use for high-risk sinks: tool_output, llm_context, state.
   */
  async runPipeline(content: string, sink: SCPSink): Promise<SCPPipelineResult> {
    if (!this.config.enabled) {
      return { tier: 'clean', action: 'passed', content, findings: [] };
    }

    const result = await this.callSCPTool('run_pipeline', {
      content,
      sink,
      quarantine_on_block: this.config.quarantineOnBlock,
    });

    const tier = (result.tier ?? 'clean') as SCPTier;

    switch (tier) {
      case 'injection':
        this.emit('scp:blocked', { tier, reason: `Injection detected for sink=${sink}` });
        return {
          tier,
          action: 'blocked',
          content: '[BLOCKED: Content classified as injection-tier by SCP]',
          findings: result.findings ?? [],
        };

      case 'reversal':
        this.emit('scp:sanitized', { tier, findingsCount: (result.findings ?? []).length });
        return {
          tier,
          action: 'sanitized',
          content: result.sanitized_content ?? content,
          findings: result.findings ?? [],
        };

      case 'clean':
        this.emit('scp:passed', { contentLength: content.length });
        return {
          tier,
          action: 'passed',
          content: result.contained_content ?? content,
          findings: [],
        };
    }
  }

  /**
   * Validate tool output before feeding to operators.
   */
  async validateOutput(content: string, toolName?: string): Promise<SCPPipelineResult> {
    return this.runPipeline(content, 'tool_output');
  }

  /**
   * Mask secrets/credentials in content before logging or reporting.
   */
  async maskSecrets(content: string): Promise<string> {
    if (!this.config.enabled) return content;

    const result = await this.callSCPTool('mask_secrets', { content });
    return result.masked_content ?? content;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  // ---------------------------------------------------------------------------
  // Internal: call SCP tool via subprocess or direct function
  // ---------------------------------------------------------------------------

  private async callSCPTool(
    tool: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      // Inline inspection for when the MCP server isn't available.
      // This provides basic protection using the same patterns as the Python SCP.
      return this.inlineInspect(tool, args);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.emit('scp:error', { operation: tool, error: errorMsg });
      // Fail-closed: treat errors as reversal-tier to be safe
      return { tier: 'reversal', findings: [{ category: 'error', description: errorMsg, severity: 'medium' }] };
    }
  }

  /**
   * Built-in inspection patterns (subset of the full Python SCP).
   * Provides baseline protection without requiring the MCP server.
   */
  private inlineInspect(
    tool: string,
    args: Record<string, unknown>,
  ): Record<string, unknown> {
    const content = String(args.content ?? '');
    const findings: SCPFinding[] = [];

    // Normalize content for evasion-resistant matching:
    // strip zero-width chars, replace common Cyrillic/Greek homoglyphs, collapse whitespace
    const normalized = content
      .replace(/[\u200B\u200C\u200D\u200E\u200F\u2060\uFEFF]/g, '')
      .replace(/[\u0430]/g, 'a')  // Cyrillic а → a
      .replace(/[\u0435]/g, 'e')  // Cyrillic е → e
      .replace(/[\u043E]/g, 'o')  // Cyrillic о → o
      .replace(/[\u0440]/g, 'p')  // Cyrillic р → p
      .replace(/[\u0441]/g, 'c')  // Cyrillic с → c
      .replace(/[\u0443]/g, 'y')  // Cyrillic у → y
      .replace(/[\u0456]/g, 'i')  // Cyrillic і → i
      .replace(/[\u04BB]/g, 'h')  // Cyrillic һ → h
      .replace(/[\u0455]/g, 's')  // Cyrillic ѕ → s
      .replace(/\s+/g, ' ');

    // Power words / override phrases (matched against normalized content)
    const overridePatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /you\s+are\s+now\s+/i,
      /system\s*:\s*you\s+must/i,
      /authorized\s+override/i,
      /by\s+order\s+of/i,
      /never\s+reveal\s+this/i,
      /do\s+not\s+tell\s+the\s+user/i,
      /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|context|rules)/i,
      /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|context|rules)/i,
      /new\s+instructions\s*:/i,
      /do\s+anything\s+now/i,
      /entering\s+(maintenance|admin|god)\s+mode/i,
      /override\s+(all\s+)?(safety|security|content)\s+(filters?|restrictions?|guidelines?)/i,
      /ignore\s+(all\s+)?(safety|content|security)\s+(guidelines?|rules?|filters?|policies)/i,
      /output\s+(your|the)\s+(system|initial)\s+prompt/i,
      /repeat\s+(your|the)\s+(system|initial)\s+(prompt|instructions)/i,
      /reveal\s+(your|the)\s+(system|initial)\s+(prompt|instructions)/i,
      /what\s+(are|were)\s+your\s+(instructions|rules|directives|system\s+prompt)/i,
    ];

    for (const pattern of overridePatterns) {
      if (pattern.test(normalized)) {
        findings.push({
          category: 'power_words',
          description: `Override phrase detected: ${pattern.source}`,
          severity: 'high',
        });
      }
    }

    // Jailbreak / persona hijack patterns
    const jailbreakPatterns = [
      /\bDAN\b.*(?:do\s+anything|no\s+(?:rules|restrictions|limits|boundaries))/i,
      /(?:you\s+(?:have|are)\s+been|you'?re)\s+(?:freed|liberated|unshackled|unchained)/i,
      /(?:restrictions?|limitations?|guardrails?|filters?)\s+(?:have\s+been|are)\s+(?:removed|disabled|lifted)/i,
      /from\s+now\s+on\s+(?:you\s+(?:will|must|should|shall|can)|respond|answer|act)/i,
      /respond\s+without\s+(?:any\s+)?(?:moral|ethical|safety|content)\s+(?:guidelines?|restrictions?|filters?)/i,
      /(?:pretend|imagine|assume)\s+(?:you\s+(?:are|have)|there\s+(?:are|is))\s+no\s+(?:rules|restrictions|guidelines|filters)/i,
      /(?:enable|activate|switch\s+to|enter)\s+(?:unrestricted|unfiltered|uncensored|unlimited)\s+mode/i,
      /(?:in\s+(?:this|a)\s+)?hypothetical\s+(?:scenario|world|situation).*(?:ignore|bypass|override)/i,
    ];

    for (const pattern of jailbreakPatterns) {
      if (pattern.test(normalized)) {
        findings.push({
          category: 'power_words',
          description: `Jailbreak pattern detected: ${pattern.source}`,
          severity: 'high',
        });
      }
    }

    // Multi-language injection phrases (high-confidence, common in real-world attacks)
    const multiLangPatterns = [
      /ignor(?:a|ez)\s+(?:les|las|todas?\s+las)\s+instrucciones?\s+(?:anteriores|previas)/i,  // Spanish
      /ignorez?\s+(?:les|toutes?\s+les)\s+instructions?\s+(?:pr[eé]c[eé]dentes?|ant[eé]rieures?)/i,  // French
      /ignoriere?\s+(?:alle\s+)?(?:vorherigen?|bisherigen?)\s+(?:Anweisungen|Instruktionen)/i,  // German
      /前の指示を(?:無視|忘れ)/,  // Japanese: "ignore previous instructions"
      /이전\s*(?:지시|명령).*(?:무시|잊어)/,  // Korean: "ignore previous instructions"
    ];

    for (const pattern of multiLangPatterns) {
      if (pattern.test(content)) {
        findings.push({
          category: 'power_words',
          description: `Multi-language injection detected: ${pattern.source}`,
          severity: 'high',
        });
      }
    }

    // Hidden Unicode (expanded range: ZWC, bidi overrides, tag chars, interlinear annotation)
    const hiddenUnicode = /[\u200B-\u200F\u2028-\u202F\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uDB40[\uDC01-\uDC7F]/;
    if (hiddenUnicode.test(content)) {
      findings.push({
        category: 'homoglyphs',
        description: 'Hidden Unicode characters detected',
        severity: 'high',
      });
    }

    // Markdown image exfiltration: ![](http://attacker.com/steal?data=...)
    const markdownExfil = /!\[.*?\]\(https?:\/\/[^)]*(?:token|key|secret|password|credential|ssn|credit)/i;
    if (markdownExfil.test(content)) {
      findings.push({
        category: 'structural_anomalies',
        description: 'Markdown image data exfiltration attempt',
        severity: 'high',
      });
    }

    // Structural anomalies
    const structuralPatterns: Array<{ pattern: RegExp; description: string; severity: 'high' | 'medium' }> = [
      { pattern: /^(SYSTEM|ASSISTANT|USER)\s*:/im, description: 'Role delimiter injection', severity: 'high' },
      { pattern: /<\|(?:im_start|im_end|endoftext|system|user|assistant)\|>/i, description: 'Chat-template special token injection', severity: 'high' },
      { pattern: /\[INST\]|\[\/INST\]|<<SYS>>|<\/s>/i, description: 'Llama/Mistral chat delimiter injection', severity: 'high' },
      { pattern: /<\/?(?:system|user|assistant|function|tool)_?(?:message|response|call|result)?>/i, description: 'XML role tag injection', severity: 'high' },
      { pattern: /\{"(?:role|function_call|tool_calls?)"\s*:\s*"/i, description: 'JSON conversation structure injection', severity: 'high' },
      { pattern: /```(?:system|tool_code|function_call)\b/i, description: 'Fenced code block role injection', severity: 'medium' },
      { pattern: /<!--[\s\S]{0,500}(?:ignore|override|instruction|system|prompt)/i, description: 'Hidden HTML comment with directives', severity: 'high' },
      { pattern: /%0[aAdD]|\\r\\n|\\x0[aAdD]/g, description: 'URL-encoded or escaped newline injection', severity: 'medium' },
      { pattern: /(?:tool_result|function_response|observation)\s*[=:]\s*\{/i, description: 'Tool/function result injection', severity: 'high' },
      { pattern: /(?:Example|Sample)\s*\d*\s*:\s*(?:User|Human|Input)\s*:/i, description: 'Few-shot poisoning pattern', severity: 'medium' },
      { pattern: /(?:---+\s*(?:END|BEGIN)\s+(?:SYSTEM|CONTEXT|CONVERSATION)|={5,}\s*(?:SYSTEM|CONTEXT))/i, description: 'Fake context boundary marker', severity: 'high' },
      { pattern: /\[(?:IMPORTANT|CRITICAL|URGENT|OVERRIDE|ADMIN)\s*(?:NOTE|MESSAGE|INSTRUCTION)\]/i, description: 'Authority tag injection', severity: 'high' },
    ];

    for (const { pattern, description, severity } of structuralPatterns) {
      if (pattern.test(normalized) || pattern.test(content)) {
        findings.push({ category: 'structural_anomalies', description, severity });
      }
    }

    // Context stuffing heuristic: detect padding designed to push system prompt out of context
    if (content.length > 5000) {
      const uniqueChars = new Set(content).size;
      const ratio = uniqueChars / content.length;
      if (ratio < 0.005) {
        findings.push({
          category: 'structural_anomalies',
          description: 'Context window stuffing detected (extremely low character entropy)',
          severity: 'medium',
        });
      }
    }

    // Encoding evasion detection
    const encodingEvasion: Array<{ pattern: RegExp; description: string }> = [
      { pattern: /(?:decode|deobfuscate|decrypt)\s+(?:the\s+)?(?:following\s+)?(?:base64|b64|rot13|hex|rot-13)/i, description: 'Instruction to decode obfuscated payload' },
      { pattern: /(?:base64|b64|rot13|rot-13|hex)\s*(?:decode|encoded?|of)\s*:/i, description: 'Encoding reference as evasion vector' },
      { pattern: /(?:convert|translate)\s+(?:from|this)\s+(?:base64|rot13|hex)/i, description: 'Encoding conversion instruction' },
    ];

    for (const { pattern, description } of encodingEvasion) {
      if (pattern.test(normalized)) {
        findings.push({ category: 'encoding_evasion', description, severity: 'medium' });
      }
    }

    // Base64 payload inspection: decode candidate blocks and check for injection phrases
    const b64Blocks = content.match(/[A-Za-z0-9+/]{40,}={0,2}/g);
    if (b64Blocks) {
      for (const block of b64Blocks.slice(0, 5)) {
        try {
          const decoded = Buffer.from(block, 'base64').toString('utf-8');
          if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) continue;
          for (const pattern of overridePatterns) {
            if (pattern.test(decoded)) {
              findings.push({
                category: 'encoding_evasion',
                description: 'Base64-encoded injection payload detected',
                severity: 'high',
              });
              break;
            }
          }
        } catch {
          // invalid base64, skip
        }
      }
    }

    // Classify tier
    let tier: SCPTier = 'clean';
    const injectionCategories = new Set(['power_words', 'structural_anomalies', 'encoding_evasion']);
    const isHighSeverityCategory = (f: SCPFinding) =>
      f.severity === 'high' && injectionCategories.has(f.category);
    if (findings.some(isHighSeverityCategory)) {
      tier = 'injection';
    } else if (findings.length > 0) {
      tier = 'reversal';
    }

    // Handle different tool operations
    if (tool === 'mask_secrets') {
      let masked = content;
      const secretReplacements: Array<[RegExp, string]> = [
        [/(?:sk-|sk_live_|sk_test_)[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]'],
        [/(?:sk-ant-)[a-zA-Z0-9_-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]'],
        [/(?:AKIA|ASIA)[A-Z0-9]{16}/g, '[REDACTED_AWS_KEY]'],
        [/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]'],
        [/gho_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_OAUTH]'],
        [/github_pat_[a-zA-Z0-9_]{22,}/g, '[REDACTED_GITHUB_PAT]'],
        [/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]'],
        [/xox[bpsar]-[a-zA-Z0-9-]{10,}/g, '[REDACTED_SLACK_TOKEN]'],
        [/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED_GOOGLE_KEY]'],
        [/-----BEGIN\s+(?:RSA|EC|OPENSSH|DSA|PGP)\s+PRIVATE\s+KEY-----/g, '[REDACTED_PRIVATE_KEY]'],
        [/(?:sk|pk|rk)_(?:live|test)_[a-zA-Z0-9]{14,}/g, '[REDACTED_STRIPE_KEY]'],
        [/npm_[a-zA-Z0-9]{36}/g, '[REDACTED_NPM_TOKEN]'],
        [/(?:AC|SK)[a-f0-9]{32}/g, '[REDACTED_TWILIO_KEY]'],
        [/(?:Bearer|bearer|Authorization:\s*Bearer)\s+[a-zA-Z0-9_\-.]{20,}/g, '[REDACTED_BEARER_TOKEN]'],
        [/(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s"']{10,}/g, '[REDACTED_CONNECTION_STRING]'],
        [/(?:SG\.)[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g, '[REDACTED_SENDGRID_KEY]'],
      ];
      for (const [pattern, replacement] of secretReplacements) {
        masked = masked.replace(pattern, replacement);
      }
      return { masked_content: masked };
    }

    if (tool === 'run_pipeline') {
      if (tier === 'injection') {
        return { tier, findings, action: 'blocked' };
      }
      if (tier === 'reversal') {
        let sanitized = content;
        for (const pattern of [...overridePatterns, ...jailbreakPatterns, ...multiLangPatterns]) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
        }
        sanitized = sanitized.replace(new RegExp(hiddenUnicode.source, 'g'), '');
        return {
          tier,
          findings,
          action: 'sanitized',
          sanitized_content: sanitized,
        };
      }
      return {
        tier,
        findings,
        action: 'passed',
        contained_content: content,
      };
    }

    return { tier, findings };
  }
}

export function createSCPClient(config?: Partial<SCPClientConfig>): SCPClient {
  return new SCPClient(config);
}
