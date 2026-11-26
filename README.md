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

![scores: re-derivable](https://img.shields.io/badge/scores-re--derivable-brightgreen) &nbsp; ![verify-claims 27/27](https://img.shields.io/badge/verify--claims-27%2F27-brightgreen) &nbsp; ![PRs welcome](https://img.shields.io/badge/PRs-welcome-purple) &nbsp; ![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue)

---

## What is BLU3H4T?

BLU3H4T is a **governance-first blue team** platform. Eight defensive
operators model attacker behavior to **detect**, **validate**, and **respond**
to threats against your organization — with human-in-the-loop gates on every
active response.

Three things set it apart:

1. **Governance-first.** SCP content gates, org-intent hard boundaries
   (hb-1..hb-5), scope matching on mission targets, and human-in-the-loop
   approval gates compose a governance stack that wraps every operator and
   tool path. Active-response actions require human confirmation.
2. **Purple team built in.** The VALIDATOR operator can probe your own
   systems — with strict scoping and HITL gates — to find vulnerabilities
   before attackers do.
3. **AI attacker detection.** WATCHER and the detection engine fingerprint
   autonomous agents (ReAct loops, tool signatures, rapid-sequential probing)
   using an 18-technique defender playbook — see
   [ANTI_AI_REDTEAM_DESIGN](docs/ANTI_AI_REDTEAM_DESIGN.md).

## Defensive operators (8)

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

Source: `src/governance/` (6 modules) — `scp-client.ts`, `org-intent.ts`,
`hitl.ts`, `risk-tiers.ts`, `scope-match.ts`. Mission target semantics:
[mission-targets-semantics](docs/governance/mission-targets-semantics.md)

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

### Path 1 — CLI smoke (no server)

```bash
npm install
npm run build
npx t3mp3st test          # connectivity / provider smoke
npm run doctor            # optional: toolchain + config checks
```

### Path 2 — Programmatic (governance + detection)

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

Set `T3MP3ST_AUTHORIZED_SCOPE` (or `authorizedScope` above) so med-tier tools
can scope-check targets — see
[mission-targets-semantics](docs/governance/mission-targets-semantics.md).

### Path 3 — War Room server

```bash
npm install
npm run server        # War Room → http://127.0.0.1:3333/ui/
```

Governance is **enabled by default** on the War Room server (SCP, org-intent, HITL, risk tiers). In Settings you can also connect a local agent (Claude Code / Codex / Hermes / OpenCode / Oh My Pi). Optional env vars:

| Variable | Default | Purpose |
|----------|---------|---------|
| `T3MP3ST_GOVERNANCE` | on | Set to `0` to disable governance on the server path |
| `ORG_INTENT_PATH` | built-in defaults | Path to org-intent policy JSON |
| `T3MP3ST_AUTHORIZED_SCOPE` | none | Comma-separated authorized targets (e.g. `10.0.0.0/24,.example.com`) |
| `T3MP3ST_HITL_AUTO_LOW` | on | Set to `0` to require HITL for low-tier tools |
| `T3MP3ST_TSHARK_IFACES` | none | Comma-separated NICs allowed for `tshark_live_capture` (e.g. `lo,eth0`); empty fails closed |

For production deployments, set `T3MP3ST_AUTHORIZED_SCOPE` so med-tier tools can scope-check authorized targets (empty scope fails closed for active probes). Live packet capture is optional and gated by `T3MP3ST_TSHARK_IFACES` — never ungated `-i`.

Connect a local agent (Claude Code / Codex / Hermes) in Settings, or set an API key:

```bash
```bash
export OPENROUTER_API_KEY=...     # or VENICE_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY
export NOVITA_API_KEY=...         # Novita AI's hosted OpenAI-compatible API
# xAI / Grok keys are intentionally unsupported on this fork — do not set XAI_API_KEY
```

Novita AI is an opt-in third-party hosted provider. Requests send the selected
model id, prompts/context, generated output, and request metadata to Novita;
your API key authenticates those requests. Review Novita's current
[privacy policy](https://novita.ai/legal/privacy-policy) and
[terms](https://novita.ai/legal/terms-of-service) before using sensitive target
data. T3MP3ST does not claim independent assurance for sensitive workloads.

Slow local agents can be given more room with `T3MP3ST_LOCAL_AGENT_TIMEOUT_MS`
for each CLI call, `T3MP3ST_TASK_TIMEOUT_MS` for mission tasks, and
`T3MP3ST_GENERAL_TIMEOUT_MS` for planning requests. Values are milliseconds.

Claude Code session reuse is disabled by default because a resumed coding-agent
session may retain provider-side context and ambient tool authority outside the
Arsenal receipt boundary. Operators who explicitly trust their local Claude
Code configuration as a separate execution authority may set
`T3MP3ST_TRUST_CLAUDE_SESSION=1`; reuse remains isolated to one task and the
choice must not be treated as an Arsenal-enforced sandbox.

Or run **fully offline** on your own model — no key, no cloud. Defaults to Ollama; point it at any OpenAI-compatible server (LM Studio, vLLM, llama.cpp):

```bash
ollama serve && ollama pull llama3
export TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api
export TEMPEST_LOCAL_MODEL=llama3
npm run build
npx tempest
```

Check re-derivable claims:

```bash
npm run verify-claims
```

Step-by-step operator usage: [Getting Started](docs/GETTING_STARTED.md). Upstream CTF/bench docs remain under [docs/](docs/) after sync.

### Docker

```bash
cp .env.example .env
docker compose up -d       # API → http://localhost:3333 (binds 127.0.0.1)
docker compose logs -f
```

Full deployment guide: [docs/DOCKER.md](docs/DOCKER.md).

## Updating from upstream

If you track this fork, prefer the sync PR workflow (`sync/upstream-*`) over blind hard-reset. Upstream's updater scripts are available if you installed from a tarball — see `npm run update` / `update:dry`. **Do not** use `update:hard` on a BLU3H4T fork if it would discard blue-hat commits.
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

## Team presets

| Preset | Operators | Use case |
|---|---|---|
| `balanced` | All 8 | Full defensive coverage |
| `monitoring` | SENTINEL, WATCHER, GUARDIAN, ANALYST | Detection and reporting only |
| `incident` | WATCHER, HUNTER, RESPONDER, GUARDIAN, ANALYST | Active incident response |
| `purple` | SENTINEL, WATCHER, VALIDATOR, HUNTER, GUARDIAN, ANALYST | Detection + vulnerability validation |

## Documentation

**Providers:** OpenRouter, Venice, Anthropic, OpenAI, or a keyless local agent (Claude Code / Codex / Hermes / OpenCode / Oh My Pi). Set `OPENROUTER_API_KEY` / `VENICE_API_KEY` / `ANTHROPIC_API_KEY`, or connect an agent in Settings. xAI/Grok is not supported on this fork.

| Doc | Contents |
|---|---|
| [FORK_LINEAGE](docs/FORK_LINEAGE.md) | Upstream fork: kept, inverted, added; operator mapping |
| [COMPARATIVE_ANALYSIS](docs/COMPARATIVE_ANALYSIS.md) | Gap analysis: T3MP3ST vs Blue-Hat / SCP / PentAGI |
| [SCOPE_AND_AUTHORIZATION](docs/SCOPE_AND_AUTHORIZATION.md) | Authority model, scope receipts, evidence rules |
| [mission-targets-semantics](docs/governance/mission-targets-semantics.md) | `mission.targets` + authorized scope wiring |
| [DETECTION_ENGINE_DESIGN](docs/DETECTION_ENGINE_DESIGN.md) | Detection subsystem (13 files) and rule taxonomy |
| [ANTI_AI_REDTEAM_DESIGN](docs/ANTI_AI_REDTEAM_DESIGN.md) | AI attacker detection: 18-technique playbook |
| [RESPONSE_DECEPTION_DESIGN](docs/RESPONSE_DECEPTION_DESIGN.md) | RESPONDER / DECEIVER design |
| [FEATURES](FEATURES.md) | Feature-by-feature status |
| [WHITEPAPER](WHITEPAPER.md) | Technical architecture reference |
| [VISION](VISION.md) | Research directions (defensive reframe) |

## Fork lineage

Forked from [elder-plinius/T3MP3ST](https://github.com/elder-plinius/T3MP3ST).
BLU3H4T keeps the Arsenal, War Room, benchmarks, and evidence vault; adds a
governance stack and 13-file detection engine; reframes operators for blue-team
detect / validate / respond. Upstream offensive modules remain for **authorized
purple-team** use only.

Full comparison: [FORK_LINEAGE.md](docs/FORK_LINEAGE.md). Governance patterns
from the [portfolio harness](https://github.com/ManintheCrowds).

## Contributing

Build for defenders. HITL gates and org-intent boundaries are non-negotiable.

1. Fork → branch → PR with tests.
2. Governance changes: add HITL gate coverage + org-intent boundary checks.
3. New operators: define D3FEND tactic mapping, risk tier, and system prompt.

## License

AGPL-3.0. See [LICENSE](LICENSE).

