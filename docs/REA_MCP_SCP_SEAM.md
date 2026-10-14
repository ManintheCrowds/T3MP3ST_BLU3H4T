# REA MCP + SCP seam (inventory / evidence lane)

**Status:** Workspace opt-in · **Risk:** High · **Native Ghidra via REA:** denied in mcp.json  
**Upstream:** [morluto/rea](https://github.com/morluto/rea) (`rea-agents` npm) · Website [rea.tools](https://rea.tools/)  
**Fragment:** [`.cursor/mcp.rea.enable.fragment.json`](../../.cursor/mcp.rea.enable.fragment.json)  
**Native binary SSOT:** [GHIDRA_MCP_SCP_SEAM.md](GHIDRA_MCP_SCP_SEAM.md) + [ghidra_mcp_gated.py](../../local-proto/scripts/ghidra_mcp_gated.py)

## Purpose

Register [REA](https://github.com/morluto/rea) as a **workspace-only** MCP server for investigation workflows and evidence packets — especially **JavaScript / Electron** and **package inventory** — without creating a second ungated Ghidra bridge.

```text
ESCALATE: REA MCP must not become a second ungated Ghidra bridge.
```

REA can invoke its **own** headless Ghidra provider when `GHIDRA_INSTALL_DIR` / `REA_ANALYSIS_PROVIDER=ghidra` are set on the MCP process. That path bypasses job-scoped `GHIDRA_MCP_APPROVE` / SCP in `ghidra_mcp_gated.py`. **Do not** put those env keys on the `rea` server in mcp.json.

## Tooling preference (operator)

| Preference | Surface | Gate |
|------------|---------|------|
| 1 — Prefer | REA MCP: investigation + evidence packets; JS/Electron; package inventory | Workspace mcp.json only; High tier; SCP before handoff/state persist |
| 2 — Native binary | `ghidra` → `ghidra_mcp_gated.py` only | Cold JSON → desk APPROVE ON + optional `OPENED_AT` → bounded reads → APPROVE OFF |
| 3 — Deny | REA + Ghidra provider env; LaurieWired `bridge_mcp_ghidra.py`; global mcp mirror; OpenClaw; Grok Build `rea setup` | `ESCALATE` / do not merge |

## Architecture

```
authorized JS/Electron/package target (human-scoped path)
        │
        ▼
rea MCP (npx rea-agents@PIN mcp via audit_wrapper)
   │  no GHIDRA_INSTALL_DIR / no REA_ANALYSIS_PROVIDER=ghidra
   │  evidence packets → SCP before handoff/state
        │
        ▼
Cursor agent (inventory / modules / IPC / unknowns)

authorized native PE (separate job)
        │
        ▼
Ghidra GUI + GhidraMCPPlugin ──HTTP──► 127.0.0.1
        │
        ▼
ghidra_mcp_gated.py (APPROVE / MUTATE / SCP)
```

## Risk tier and HITL

| Item | Value |
|------|--------|
| Risk tier | **High** ([TOOL_SAFEGUARDS](../../local-proto/docs/TOOL_SAFEGUARDS.md)) |
| Enable in workspace mcp.json | `APPROVAL_NEEDED: REA MCP register in workspace mcp.json only — …` |
| Native decomp | Never via REA env; use `APPROVAL_NEEDED: ghidra-mcp …` + desk APPROVE |
| Goal vs constraint | `ESCALATE` |
| Ambiguous auth/scope | `REQUEST_HUMAN` |

## Scope: workspace vs global MCP

**Preferred:** `mcpServers.rea` in **workspace** `.cursor/mcp.json` only.  
**Deny:** mirror into `%USERPROFILE%/.cursor/mcp.json` without a separate approval.  
**Deny:** `npx rea-agents setup` (multi-client / Grok Build / skill sprawl). Manual pin only.

## Allow / deny

**Allow:** static JS/Electron analysis, package/resource inventory, evidence-shaped tool results for authorized local paths; SCP-contained summaries in Evidence / GearHead lab notes.

**Deny:** `GHIDRA_INSTALL_DIR`, `REA_ANALYSIS_PROVIDER=ghidra`, `JAVA_HOME` for REA Ghidra on the `rea` MCP env; OpenClaw wire; global mirror; APPROVE bake-in; functional circumvention / exploit PoCs in GearHead (see [PRD](../../local-proto/GearHead/docs/PRD.md)).

## Unknowns (stamp when operating)

- Exact pin: run `npm view rea-agents version` before bumping args (live pin documented in fragment).
- Node runtime: REA needs Node 22.19+ / 24.11+ / 26+ (this host checked separately).
- Third-party target path and auth contract: operator-supplied; default lab uses harness-owned fixture pointer under GearHead `docs/lab/`.

## Operator enable checklist

1. Chat: `APPROVAL_NEEDED: REA MCP register in workspace mcp.json only — review diff vs ghidra_mcp_gated; no global mirror; no OpenClaw; no APPROVE baked into JSON`.
2. Confirm Node on PATH; pin `rea-agents@X.Y.Z` via `npm view`.
3. Merge `rea` from [`.cursor/mcp.rea.enable.fragment.json`](../../.cursor/mcp.rea.enable.fragment.json) into workspace mcp.json (**no** Ghidra provider env).
4. Reload Cursor MCP. Prefer REA for JS/package inventory. For native: existing `ghidra` job-scoped loop only.
5. Before handoff/state: SCP pipeline on REA tool output (`sink=llm_context|handoff|state`).

## Related

- [GHIDRA_MCP_JOB_SCOPED_APPROVE.md](../../local-proto/docs/GHIDRA_MCP_JOB_SCOPED_APPROVE.md)
- [GearHead RE lab harness](../../local-proto/GearHead/docs/lab/RE_LAB_HARNESS.md)
- Hygiene: `local-proto/tests/test_rea_mcp_json_hygiene.py`
