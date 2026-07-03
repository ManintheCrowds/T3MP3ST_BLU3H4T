# Comparative Analysis: T3MP3ST BLU3H4T vs Blue-Hat-Bitcoin / SCP / PentAGI

## Purpose

This document compares three security systems and maps the integration path
that transforms T3MP3ST from an offensive red team framework into an
organizational defense platform against unethical autonomous red teams.

---

## System Profiles

### T3MP3ST BLU3H4T (this repo — fork of elder-plinius/T3MP3ST)

**Posture:** Originally offensive. Multi-agent kill chain framework for
penetration testing. TypeScript/Node.js, ~12K LOC backend + 14K UI + 83K MCP.

**Live capabilities:** Recon engine (tool-backed ReAct loop), benchmarking
(90.1% XBEN, 21/40 Cybench), War Room UI, MCP server, cognitive architecture
for CTF/vuln solving, 15+ real security tools, 9 "Pliny Specials."

**Governance (original):** Scope & Authorization model, OPSEC levels, operator
burn mechanism.

**Source:** `src/operators/index.ts`, `src/arsenal/index.ts`, `src/mission/index.ts`,
`src/opsec/index.ts`, `src/evidence/index.ts`

### Blue-Hat-Bitcoin + SCP (portfolio harness / local-proto)

**Posture:** Defensive. Content-safety and governance framework.

| Capability | Source |
|---|---|
| SCP pipeline (inspect→sanitize→contain→quarantine) | `local-proto/scripts/scp_mcp.py` |
| org-intent hard boundaries (hb-1..hb-5) | `org-intent-spec/examples/org-intent.bitcoin-inspired.json` |
| HITL gates (APPROVAL_NEEDED / ESCALATE / REQUEST_HUMAN) | `local-proto/docs/TOOL_SAFEGUARDS.md` |
| Provenance tracking (document + Bitcoin on-chain) | `local-proto/scripts/provenance_mcp.py` |
| Security-audit-rules (prompt injection defense) | `.cursor/skills/security-audit-rules/SKILL.md` |
| Risk-tiered tool access (Low/Med/High) | `local-proto/docs/TOOL_SAFEGUARDS.md` |
| Observability layer (AI-inaccessible audit logs) | `local-proto/docs/OBSERVABILITY_LAYER.md` |
| Agent integrity pre-engagement runbook | `.cursor/docs/AGENT_INTEGRITY_PRE_ENGAGEMENT_RUNBOOK.md` |
| Credential vault with human-gated access | `local-proto/scripts/credential_vault_mcp.py` |

---

## Comparative Matrix

### What T3MP3ST has that the portfolio harness lacks

| Capability | Defensive pivot value |
|---|---|
| Multi-agent kill chain execution | Agents that model attacker behavior to PREDICT and DETECT attacks |
| 15+ real security tools (nmap, sqlmap, xss_scan) | VALIDATION tools: "can we be exploited?" not "exploit them" |
| Cognitive architecture (hypothesis engine) | Hypothesis about INCOMING attack patterns, not outgoing |
| Benchmark infrastructure (verify-claims) | Measure DETECTION rates, not exploit rates |
| War Room UI with SSE streaming | SOC dashboard for blue team monitoring |
| Evidence Vault (findings, CVSS, artifacts) | Incident evidence collection |
| OPSEC layer (detection events, IOCs) | These ARE the things we want to DETECT, not avoid |
| Payload databases (200+ SQLi, XSS, SSTI) | Signature database for WAF rules and detection patterns |
| MITRE ATT&CK technique mappings | Know the enemy: attack technique awareness for defense |
| Scope & Authorization model | Keep and strengthen with org-intent |

### What the portfolio harness has that T3MP3ST lacks

| Capability | Integration path |
|---|---|
| SCP pipeline | Gate ALL content entering the platform (MCP bridge) |
| org-intent hard boundaries | Governance for what the system is allowed to do |
| HITL model | Human gates before active response actions |
| Provenance tracking | IOC provenance: where did this indicator come from? |
| Prompt injection defense | Detect AI red teams manipulating our defensive AI |
| Security-audit-rules | Audit the defense platform's own MCP tools and prompts |
| Observability layer | Wrap tool invocations in audit_wrapper |
| Risk-tiered tool access | Graduated gates instead of flat "authorized only" |
| Agent integrity runbook | Pre-engagement verification of the defense system |

### Neither system has (gaps for org defense)

| Gap | Priority | Status |
|---|---|---|
| Autonomous threat detection (real-time) | P0 | Phase 2 design |
| Adversarial AI agent detection | P0 | Phase 4 design |
| SIEM/IDS/EDR integration | P0 | Phase 2 design |
| Deception technology (honeypots) | P1 | Phase 3 design |
| Incident response automation | P1 | Phase 3 design |
| Attack pattern recognition from logs | P1 | Phase 2 design |
| Blue team alerting (PagerDuty/Slack) | P1 | Phase 3 design |
| Threat intelligence feed ingestion | P2 | Future |
| Compliance/audit reporting | P2 | Future |

---

## Operator Remapping: Offensive → Defensive

| Offensive Archetype | ATT&CK | Defensive Archetype | D3FEND | Role |
|---|---|---|---|---|
| Recon | TA0043 | **SENTINEL** | D3-DE | Detect recon AGAINST us |
| Scanner | TA0007 | **WATCHER** | D3-DA | Analyze logs/traffic for patterns |
| Exploiter | TA0001 | **VALIDATOR** | D3-TE | Purple team: test OUR systems |
| Infiltrator | TA0008 | **HUNTER** | D3-TE | Proactive threat hunting for IOCs |
| Exfiltrator | TA0009 | **RESPONDER** | D3-ER | Incident response: contain + remediate |
| Ghost | TA0003 | **DECEIVER** | D3-DC | Honeypots, honeytokens, canary files |
| Coordinator | TA0011 | **GUARDIAN** | — | SCP + org-intent + HITL governance |
| Analyst | — | **ANALYST** | — | SOC reporting, compliance |

**Source:** `src/operators/defensive.ts`

---

## Governance Stack (Phase 1 — Implemented)

```
src/governance/
├── index.ts          # Composed governance stack factory
├── scp-client.ts     # SCP MCP bridge (TypeScript wrapper)
├── org-intent.ts     # org-intent hard boundary enforcement
├── hitl.ts           # Human-in-the-loop gate manager
└── risk-tiers.ts     # Tool risk classification + gate enforcement
```

**Integration flow:**

```
External Content (tool output, feeds, LLM responses)
  │
  ▼
┌─── SCP Client ───┐
│ inspectContent()  │ → injection: BLOCK
│ runPipeline()     │ → reversal: SANITIZE + CONTAIN
│ validateOutput()  │ → clean: PASS
└────────┬──────────┘
         │
┌────────▼──────────┐
│ OrgIntentEnforcer  │ → hb-1..hb-5 boundary checks
│ checkBoundaries()  │ → violation: ESCALATE
│ validateMission()  │ → scope empty: BLOCK
└────────┬──────────┘
         │
┌────────▼──────────┐
│ RiskTierGate       │ → Low: proceed
│ checkGate()        │ → Med: scope check
│                    │ → High: APPROVAL_NEEDED
└────────┬──────────┘
         │
┌────────▼──────────┐
│ HITLGateManager    │ → requestApproval()
│                    │ → escalate()
│                    │ → requestGuidance()
└────────┬──────────┘
         │
         ▼
  Safe to proceed
```

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language bridge | MCP bridge | SCP stays Python; Tempest consumes via MCP. Clean separation |
| MITRE framework | Dual-map (ATT&CK + D3FEND) | Attack awareness essential for defense |
| Active vs passive | Purple team | VALIDATOR tests own systems with strict org-intent scoping |
| Pliny Specials | Rename to defensive equivalents | SPHINX→VALIDATOR, GRIFFIN→DETECTOR, etc. |
| War Room UI | Repurpose as SOC dashboard | Architecture sound; add defensive views |

---

## Risk Assessment

- **Risk Level:** High — significant architectural pivot
- **Rollback:** Fork is independent; upstream T3MP3ST unaffected
- **Key risk:** Offensive tools used defensively still need strict auth gates
- **Mitigation:** org-intent + HITL + SCP compose to provide governance
