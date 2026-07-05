# T3MP3ST BLU3H4T

```
 ▄▄▄█████▓▓█████  ███▄ ▄███▓ ██▓███  ▓█████   ██████ ▄▄▄█████▓
 ▓  ██▒ ▓▒▓█   ▀ ▓██▒▀█▀ ██▒▓██░  ██▒▓█   ▀ ▒██    ▒ ▓  ██▒ ▓▒
 ▒ ▓██░ ▒░▒███   ▓██    ▓██░▓██░ ██▓▒▒███   ░ ▓██▄   ▒ ▓██░ ▒░
 ░ ▓██▓ ░ ▒▓█  ▄ ▒██    ▒██ ▒██▄█▓▒ ▒▒▓█  ▄   ▒   ██▒░ ▓██▓ ░
   ▒██▒ ░ ░▒████▒▒██▒   ░██▒▒██▒ ░  ░░▒████▒▒██████▒▒  ▒██▒ ░
   ▒ ░░   ░░ ▒░ ░░ ▒░   ░  ░▒▓▒░ ░  ░░░ ▒░ ░▒ ▒▓▒ ▒ ░  ▒ ░░
     ░     ░ ░  ░░  ░      ░░▒ ░      ░ ░  ░░ ░▒  ░ ░    ░
   ░         ░   ░      ░   ░░          ░   ░  ░  ░    ░
             ░  ░       ░               ░  ░      ░

 ▄▄▄▄    ██▓     █    ██ ▓█████  ██░ ██  ▄▄▄     ▄▄▄█████▓
▓█████▄ ▓██▒     ██  ▓██▒▓█   ▀ ▓██░ ██▒▒████▄   ▓  ██▒ ▓▒
▒██▒ ▄██▒██░    ▓██  ▒██░▒███   ▒██▀▀██░▒██  ▀█▄ ▒ ▓██░ ▒░
▒██░█▀  ▒██░    ▓▓█  ░██░▒▓█  ▄ ░▓█ ░██ ░██▄▄▄▄██░ ▓██▓ ░
░▓█  ▀█▓░██████▒▒▒█████▓ ░▒████▒░▓█▒░██▓ ▓█   ▓██▒ ▒██▒ ░
░▒▓███▀▒░ ▒░▓  ░░▒▓▒ ▒ ▒ ░░ ▒░ ░ ▒ ░░▒░▒ ▒▒   ▓▒█░ ▒ ░░
▒░▒   ░ ░ ░ ▒  ░░░▒░ ░ ░  ░ ░  ░ ▒ ░▒░ ░  ▒   ▒▒ ░   ░
 ░    ░   ░ ░    ░░░ ░ ░    ░    ░  ░░ ░  ░   ▒    ░
 ░          ░  ░   ░        ░  ░ ░  ░  ░      ░  ░
```

**Autonomous blue team defense platform. Multi-agent defensive security meta-harness.**

Protect your organization from unethical red teams — including autonomous AI attackers.

---

## What is BLU3H4T?

BLU3H4T **inverts the offensive kill chain**. Where the upstream T3MP3ST
framework sends 8 operators down the attack pipeline (recon → exploit →
exfil), BLU3H4T deploys 8 *defensive* operators that model attacker behavior
to **detect**, **validate**, and **respond** to threats against your
organization.

Three things set it apart:

1. **Governance-first.** SCP content gates, org-intent hard boundaries
   (hb-1..hb-5), and human-in-the-loop approval gates compose a governance
   stack that no pure offensive framework has. Every active-response action
   requires human confirmation.
2. **Purple team built in.** The VALIDATOR operator can probe your own
   systems — with strict scoping and HITL gates — to find vulnerabilities
   before attackers do.
3. **Anti-AI red team.** Designed to detect autonomous AI agents performing
   unauthorized reconnaissance and exploitation. WATCHER identifies the
   traffic signatures of tool-driven, rapid-sequential probing.

## Defensive operators

| Operator | D3FEND | What it does |
|---|---|---|
| **SENTINEL** | Detect | Monitor attack surface; detect recon against us |
| **WATCHER** | Data Analysis | Analyze logs, traffic, alerts for attack patterns |
| **VALIDATOR** | Test/Evaluate | Purple team: test OUR systems for vulnerabilities |
| **HUNTER** | Test/Evaluate | Proactive threat hunting for IOCs and lateral movement |
| **RESPONDER** | Evict/Restore | Incident response: contain, isolate, remediate |
| **DECEIVER** | Deceive | Deploy honeypots, honeytokens, canary files |
| **GUARDIAN** | Governance | SCP + org-intent + HITL gate coordination |
| **ANALYST** | Reporting | SOC dashboards, compliance reports, threat briefs |

## Governance stack

Every content boundary and active response flows through the governance layer:

```
External content (tool output, feeds, LLM responses)
  │
  ├── SCP Pipeline ──── inspect → sanitize → contain → quarantine
  │
  ├── org-intent ────── hb-1..hb-5 hard boundary checks
  │
  ├── Risk Tiers ────── Low (pass) / Med (scope check) / High (APPROVAL_NEEDED)
  │
  └── HITL Gates ────── requestApproval() / escalate() / requestGuidance()
```

Source: `src/governance/` — `scp-client.ts`, `org-intent.ts`, `hitl.ts`, `risk-tiers.ts`

## Detection engine

13-file subsystem for real-time threat detection and alert correlation:

```
Inbound traffic / logs / events
  │
  ├── Signature matching ── SQLi, XSS, SSTI, LFI, SSRF, XXE, command injection
  │
  ├── ATT&CK rules ─────── recon, scanning, exploitation, lateral movement, exfil
  │
  ├── Anomaly engine ────── adaptive baselines, statistical deviation scoring
  │
  ├── AI agent detector ─── ReAct loop fingerprinting, tool signatures, timing
  │
  ├── Correlator ─────────── temporal/spatial alert grouping, confidence scoring
  │
  └── SIEM connectors ───── Wazuh, ELK (Splunk, QRadar planned)
```

Source: `src/detection/` — 13 files, factory: `createDetectionEngine()`

## Quick start

```bash
npm install
npm run server        # War Room → http://127.0.0.1:3333/ui/
```

Governance is **enabled by default** on the War Room server (SCP, org-intent, HITL, risk tiers). Optional env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `T3MP3ST_GOVERNANCE` | on | Set to `0` to disable governance on the server path |
| `ORG_INTENT_PATH` | built-in defaults | Path to org-intent policy JSON |
| `T3MP3ST_AUTHORIZED_SCOPE` | none | Comma-separated authorized targets (e.g. `10.0.0.0/24,.example.com`) |
| `T3MP3ST_HITL_AUTO_LOW` | on | Set to `0` to require HITL for low-tier tools |

For production deployments, set `T3MP3ST_AUTHORIZED_SCOPE` so med-tier tools can scope-check authorized targets (empty scope fails closed for active probes).

Connect a local agent (Claude Code / Codex / Hermes) in Settings, or set an API key:

```bash
export OPENROUTER_API_KEY=...     # or ANTHROPIC_API_KEY
```

### Programmatic (governance + detection)

```typescript
import { createTempest } from 't3mp3st';

const t = createTempest({
  name: 'SOC-Watch',
  llm: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4' },
  governance: { enabled: true, authorizedScope: ['10.0.0.0/24'] },
  detection: { enabled: true },
});

t.start();
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLU3H4T COMMAND CENTER                       │
├─────────────────────────────────────────────────────────────────┤
│   MISSION CONTROL  ◄──  GOVERNANCE STACK  ──►  ARSENAL (TOOLS)  │
│                          ▲                                       │
│   DEFENSIVE OPERATORS:                                           │
│   SENTINEL · WATCHER · VALIDATOR · HUNTER ·                      │
│   RESPONDER · DECEIVER · GUARDIAN · ANALYST                      │
│                          ▲                                       │
│   EVIDENCE VAULT  ·  SCP PIPELINE  ·  FINDINGS LEDGER            │
│                          ▲                                       │
│   ORG-INTENT  ·  HITL GATES  ·  RISK TIERS  ·  AUDIT LOG        │
└─────────────────────────────────────────────────────────────────┘
```

## Operator-to-operator mapping (offensive → defensive)

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

## Team presets

| Preset | Operators | Use case |
|---|---|---|
| `balanced` | All 8 | Full defensive coverage |
| `monitoring` | SENTINEL, WATCHER, GUARDIAN, ANALYST | Detection and reporting only |
| `incident` | WATCHER, HUNTER, RESPONDER, GUARDIAN, ANALYST | Active incident response |
| `purple` | SENTINEL, WATCHER, VALIDATOR, HUNTER, GUARDIAN, ANALYST | Detection + vulnerability validation |

## Documentation

| Doc | Contents |
|---|---|
| [COMPARATIVE_ANALYSIS](docs/COMPARATIVE_ANALYSIS.md) | Gap analysis: T3MP3ST vs Blue-Hat / SCP / PentAGI |
| [SCOPE_AND_AUTHORIZATION](docs/SCOPE_AND_AUTHORIZATION.md) | Authority model, scope receipts, evidence rules |
| [DETECTION_ENGINE_DESIGN](docs/DETECTION_ENGINE_DESIGN.md) | Detection subsystem architecture and rule taxonomy |
| [ANTI_AI_REDTEAM_DESIGN](docs/ANTI_AI_REDTEAM_DESIGN.md) | AI red team detection: 18-technique playbook design |
| [RESPONSE_DECEPTION_DESIGN](docs/RESPONSE_DECEPTION_DESIGN.md) | Response and deception engine design |
| [FEATURES](FEATURES.md) | Feature-by-feature status |
| [WHITEPAPER](WHITEPAPER.md) | Technical architecture reference |
| [VISION](VISION.md) | Research directions (defensive reframe) |

## What this inherits from upstream T3MP3ST

The offensive infrastructure remains available for authorized purple team
operations. The recon engine, Arsenal tools, benchmark system, and War Room UI
are unchanged — what's new is the *governance layer* that wraps them and the
*defensive operator profiles* that reframe how they're used.

| From upstream | Status | Defensive use |
|---|---|---|
| Recon engine | Stable | Attack surface monitoring (SENTINEL) |
| Arsenal (15+ tools) | Stable | Validation tools (VALIDATOR, gated) |
| War Room UI | Stable | SOC dashboard |
| Evidence Vault | Stable | Incident evidence collection |
| OPSEC layer | Stable | Inverted: detection targets, not avoidance |
| Payload databases | Stable | Detection signatures |
| Benchmark system | Stable | Measure detection rates |

## Contributing

Build for defenders. HITL gates and org-intent boundaries are non-negotiable.

1. Fork → branch → PR with tests.
2. Governance changes: add HITL gate coverage + org-intent boundary checks.
3. New operators: define D3FEND tactic mapping, risk tier, and system prompt.

## License

MIT. See [LICENSE](LICENSE).

---

Forked from [elder-plinius/T3MP3ST](https://github.com/elder-plinius/T3MP3ST).
Governance stack: SCP + org-intent + HITL from
[portfolio harness](https://github.com/ManintheCrowds).
