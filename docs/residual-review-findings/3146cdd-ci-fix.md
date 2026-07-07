# CI fix audit: commit `3146cdd`

**Date:** 2026-07-07  
**Repo:** [ManintheCrowds/T3MP3ST_BLU3H4T](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T)  
**Base:** `e9929a9` (pliny defensive rename)  
**Fix commit:** `3146cdd` — `fix(ci): resolve lint and typecheck failures blocking T3MP3ST CI`

## Context

| Run | Result | URL |
|-----|--------|-----|
| Failed (first fork CI) | `npm run lint` — 17 errors | [run #28824776160](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T/actions/runs/28824776160) |
| Fixed | All 14 gates passed (~33s) | [run #28889257465](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T/actions/runs/28889257465) |

The pliny commit (`e9929a9`) triggered the fork's **first** CI execution. Lint/TS debt predated it (BLU3H4T defensive-pivot modules inherited upstream CI without prior gate runs).

**Scope:** 15 files, +114 / −93 lines.

---

## Necessary for CI (by gate)

### Gate 1 — ESLint (17 errors → 0)

| File | Rule | Change |
|------|------|--------|
| `src/cli.ts` | `no-case-declarations` | Wrapped `view` / `provider` / `apikey` switch cases in `{ }` blocks |
| `src/detection/connectors/elk.ts` | `no-this-alias` | `toArsenalTool` as arrow class field (bound `this`) |
| `src/detection/connectors/wazuh.ts` | `no-this-alias` | Same |
| `src/governance/scp-client.ts` | `no-misleading-character-class` | Split zero-width char `.replace()` into per-codepoint calls |
| `src/governance/scp-client.ts` | `no-control-regex` | Targeted `eslint-disable-next-line` on base64 binary safety check |
| `src/index.ts` | `eqeqeq` | Strict equality at lines 618, 800, 1001, 1008, 1010 |
| `src/server.ts` | `no-useless-escape` | Removed unnecessary `\-` in character classes (L140–141) |
| `src/server.ts` | `no-control-regex` | `eslint-disable-next-line` on `COMMAND_CONTROL` shell-injection guard |

### Gate 2 — TypeScript (31 errors → 0)

| Area | Change |
|------|--------|
| `src/governance/scp-client.ts` | `SCPToolResult` interface; typed `callSCPTool` / `inlineInspect` returns |
| `src/types/index.ts` | `ToolResult.data`; `Mission.targets?`; `CommandEvents['governance:mission_blocked']` |
| `src/arsenal/index.ts` | `ArsenalEvents['tool:scp_sanitized']` (emitter already existed) |
| `src/governance/org-intent.ts` | `BoundaryContext.phase` and `.scope` (used by `mission/index.ts`) |
| `src/index.ts` | `KillChainPhase.RECON`; `CorrelatedAlert` callback typing |
| `src/cli.ts` | Null guards on `createMission` / ad-hoc report mission (TS18047) |
| Detection modules | Unused import/var cleanup (`AISignalType`, connector class imports, `_source`, etc.) |

### Gates 3–14

No code changes required beyond the above; all passed on first green run and on local re-verify (2026-07-07).

---

## Unnecessary for CI but kept

| Change | Why kept |
|--------|----------|
| `scripts/prompt-audit.mjs` — `fileURLToPath` for repo root | Linux CI already passed with `pathname`; fix enables Windows local dev (`C:\C:\...` bug). Low risk. |
| Removed `execFile` / `execFileAsync` from `scp-client.ts` | Dead code (subprocess MCP bridge never wired). Cleanup, no behavior change. |
| Removed `cutoff` in `anomaly.ts`, `categories` in `correlator.ts`, registry assign in `signatures.ts` | Unused variables blocking typecheck; no behavioral effect. |
| CLI governance warning messages | Required for TS nullability; minor UX improvement when org-intent blocks mission creation. |

---

## Known residuals (not fixed in `3146cdd`)

| Item | Severity | Notes |
|------|----------|-------|
| `Mission.targets` never populated in `createMission` | P2 | Field added for typecheck; `advancePhase` reads `mission.targets ?? []` but creation never sets it. Org-intent phase checks may see empty targets until a separate populate path is defined (target addresses ≠ RoE scope strings). **Deferred** — document only; do not populate from `rules.scope` without semantic review. |
| 167 ESLint warnings | — | Non-blocking; upstream tolerates. Not in CI failure set. |
| `anomaly.ts` baseline filter no longer uses `windowMs` cutoff | P3 | `cutoff` was computed but unused before removal; pre-existing dead logic. |

---

## Review outcomes

### Critic loop (code domain)

```json
{
  "pass": true,
  "score": 0.88,
  "issues": [
    {"type": "logic_gap", "detail": "Mission.targets typed but never populated in createMission"},
    {"type": "style", "detail": "Verbose !== null && !== undefined replaces eslint-forbidden != null"},
    {"type": "scope", "detail": "prompt-audit.mjs Windows path fix not required for Linux CI"}
  ],
  "fixes": [
    {"action": "document", "detail": "Record Mission.targets gap in this file; defer populate until semantics defined"},
    {"action": "none", "detail": "Keep fileURLToPath for local dev parity"}
  ]
}
```

### Tier 2 code review (`ce-code-review` equivalent, `base:e9929a9`)

**Verdict:** Ready to merge (CI fix scope).

| # | Sev | File | Issue | Action |
|---|-----|------|-------|--------|
| 1 | P2 | `src/mission/index.ts` | `mission.targets` never set at creation | Documented above; accept residual |
| 2 | P3 | `src/index.ts` | `toArsenalTool()` cast vs arrow field | Fixed in follow-up: cast uses `toArsenalTool: () => CustomTool` |
| 3 | — | `scp-client.ts` | Removed unused `execFile` imports | Keep — dead code removal |

**Actionable findings applied:** None at P0/P1. One P3 cast cleanup in post-review follow-up.

**Residual Work Gate:** Accept and proceed — P2/P3 documented in this file.

### Local re-verify (2026-07-07)

All CI gates passed: lint (0 errors), typecheck, test (133/133), doctor, verify-claims (20/20), no-fitting, no-self-fitting, test:gate, prompt:audit, smoke.

---

## Intent alignment

Aligned with stated goal: green `T3MP3ST CI` on the fork without weakening gates or conflating with upstream `elder-plinius/T3MP3ST`.
