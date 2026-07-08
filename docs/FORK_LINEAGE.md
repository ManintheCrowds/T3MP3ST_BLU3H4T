# Fork lineage: elder-plinius/T3MP3ST → ManintheCrowds/T3MP3ST_BLU3H4T

**Upstream:** [elder-plinius/T3MP3ST](https://github.com/elder-plinius/T3MP3ST)  
**Fork:** [ManintheCrowds/T3MP3ST_BLU3H4T](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T)  
**Identity:** Autonomous **blue team** defense — governance-first detect / validate / respond.

---

## What we kept

| Component | Status | Defensive use |
|---|---|---|
| Recon engine | Stable | Attack-surface monitoring (SENTINEL) |
| Arsenal (15+ tools) | Stable | Scoped validation (VALIDATOR, HITL-gated) |
| War Room UI | Stable | SOC dashboard |
| Evidence Vault | Stable | Incident evidence collection |
| Benchmark system | Stable | Detection-rate and honesty gates |
| MCP + CLI harness | Stable | Operator and integration surface |

## What we inverted

| Upstream concept | BLU3H4T reframe |
|---|---|
| 8 offensive operators (recon → exfil) | 8 **defensive** operators (detect → report) |
| OPSEC layer (avoid detection) | Detection targets — signatures and ATT&CK rules |
| Payload databases (attack strings) | Detection signatures and WAF-style matchers |
| Unscoped tool execution | Governance stack: SCP, org-intent, HITL, risk tiers |

## What we added

| Addition | Source / path |
|---|---|
| Governance stack (SCP, org-intent hb-1..hb-5, HITL, risk tiers) | `src/governance/` (6 modules) |
| Scope matching for `mission.targets` | `src/governance/scope-match.ts` — [mission-targets-semantics](governance/mission-targets-semantics.md) |
| Detection engine (13 TypeScript files) | `src/detection/` — `createDetectionEngine()` |
| Defensive operator profiles + presets | `src/operators/defensive.ts` |
| AI attacker detection playbook (18 techniques) | `docs/AI_REDTEAM_TECHNIQUES.md`, WATCHER + `ai-detector.ts` |
| Doc verification CI gate | `npm run verify:docs` |

## Operator mapping (contributor reference)

Upstream offensive archetypes remain in code for **authorized purple-team** scenarios. Defensive operators are the **primary** user-facing model.

| Offensive (upstream) | ATT&CK | Defensive (BLU3H4T) | D3FEND |
|---|---|---|---|
| Recon | TA0043 | SENTINEL | D3-DE |
| Scanner | TA0007 | WATCHER | D3-DA |
| Exploiter | TA0001 | VALIDATOR | D3-TE |
| Infiltrator | TA0008 | HUNTER | D3-TE |
| Exfiltrator | TA0009 | RESPONDER | D3-ER |
| Ghost | TA0003 | DECEIVER | D3-DC |
| Coordinator | TA0011 | GUARDIAN | — |
| Analyst | — | ANALYST | — |

## Governance provenance

SCP + org-intent + HITL patterns are aligned with the [ManintheCrowds portfolio harness](https://github.com/ManintheCrowds). See [SCOPE_AND_AUTHORIZATION.md](SCOPE_AND_AUTHORIZATION.md) for authority and scope receipts.

## Related docs

- [COMPARATIVE_ANALYSIS.md](COMPARATIVE_ANALYSIS.md) — gap analysis vs upstream and adjacent stacks
- [PLINY_DEFENSIVE_RENAME.md](PLINY_DEFENSIVE_RENAME.md) — Pliny Special defensive aliases (EP-3)
