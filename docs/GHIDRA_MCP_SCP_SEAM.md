# GhidraMCP + SCP seam

**Status:** Documented opt-in · **Risk:** High · **Live MCP:** disabled by default  
**Audience:** Blue Hat Tempest operators, harness agents, Blue Hat Bitcoin privacy review  
**Plan:** [docs/plans/2026-09-23-002-feat-ghidra-mcp-scp-seam-plan.md](../../docs/plans/2026-09-23-002-feat-ghidra-mcp-scp-seam-plan.md)  
**Enforcing server:** [local-proto/scripts/ghidra_mcp_gated.py](../../local-proto/scripts/ghidra_mcp_gated.py) (not upstream `bridge_mcp_ghidra.py`)

## Purpose

Compose [Ghidra](https://github.com/NationalSecurityAgency/ghidra) with a **harness-gated** MCP surface (HTTP API compatible with [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP); setup narrative [0xresetti](https://0xresetti.github.io/ghidramcp.html)) for authorized binaries.

**Server-side enforcement (required):**

1. `GHIDRA_MCP_APPROVE=1` for read tools (decomp, lists, search)
2. `GHIDRA_MCP_MUTATE=1` **and** APPROVE for rename/comment/type writes
3. Every tool response runs **SCP** (`sink=llm_context`) before return; injection → blocked JSON, no raw dump
4. `GHIDRA_MCP_SERVER` must be **loopback only** (`127.0.0.1` / `localhost`)

Chat `APPROVAL_NEEDED: ghidra-mcp …` remains the human ritual; env vars are the technical gate (same pattern as credential-vault).

## Architecture

```
authorized binary (human loads in Ghidra)
        │
        ▼
Ghidra + GhidraMCPPlugin  ──HTTP──►  127.0.0.1:<port>
        │
        ▼
ghidra_mcp_gated.py  (stdio MCP; prefer audit_wrapper)
   │  GHIDRA_MCP_APPROVE / MUTATE
   │  SCP run_pipeline on every response
        │
        ▼
Cursor agent (sees contained JSON only; never raw blocked tier)
```

Do **not** register upstream `bridge_mcp_ghidra.py` in live `mcp.json` — it has no env gate and no SCP.

## Env windows (operator)

| Env | Meaning |
|-----|---------|
| unset / not `1` | Tools return `APPROVAL_NEEDED` JSON (except `ghidra_gate_status`) |
| `GHIDRA_MCP_APPROVE=1` | Read tools allowed; still SCP'd |
| `GHIDRA_MCP_MUTATE=1` | Rename/set allowed **only if** APPROVE also `1` |
| `GHIDRA_MCP_SERVER` | Default `http://127.0.0.1:8080/` |

**Flow:** Chat approval → set env on workspace MCP server → restart MCP / Cursor window → work → **unset env** when done.

## Risk tier and HITL

| Item | Value |
|------|--------|
| Risk tier | **High** ([TOOL_SAFEGUARDS](../../local-proto/docs/TOOL_SAFEGUARDS.md)) |
| Enable server in mcp.json | `APPROVAL_NEEDED: ghidra-mcp enable-mcp` (workspace only; see below) |
| Open approve window | Chat approval then `GHIDRA_MCP_APPROVE=1` |
| Mutate window | Chat + `GHIDRA_MCP_MUTATE=1` |
| Goal vs constraint | `ESCALATE` |
| Ambiguous auth/scope | `REQUEST_HUMAN` |
| HITL literals | [hitl_gate_substrings.txt](../../local-proto/config/hitl_gate_substrings.txt) |

## cyber_policy posture (how to show up)

Anthropic `cyber_policy_review` reacts to **offensive-security signal density**, not to “having Ghidra.” Treat appearance as a **classifier hygiene** problem:

| Do | Don't |
|----|--------|
| Frame as **authorized static analysis / defensive SRE / privacy review** | Paste malware tutorials, exploit PoCs, or “how to unpack” playbooks into chat |
| Keep this seam doc short; use gated MCP (small tool set) | Register full upstream bridge with every RE tool name in always-on MCP descriptors |
| Workspace `mcp.json` only | Mirror into global `~/.cursor/mcp.json` without separate approval |
| SCP-contained summaries in handoff | Raw decomp / string dumps in `handoff_latest` or alwaysApply rules |
| Open Ghidra only when analyzing; disable APPROVE env after | Leave `GHIDRA_MCP_APPROVE=1` forever |

If a turn trips cyber_policy: stop, strip RE-dense pastes, continue with contained summaries only. Material that must stay dense belongs in private `security-research/` (outside everyday Anthropic workspace) — see [security separation design](../../docs/superpowers/specs/2026-06-29-anthropic-tos-compliant-security-separation-design.md).

## Scope: workspace vs global MCP

**Preferred:** merge example into **workspace** `.cursor/mcp.json` only.  
**Defer:** global profile mirror — spreads tool schemas into every Cursor window (higher density, higher accident surface).

## Allow / deny

**Allow (after enable + env windows):** overview lists, decomp, capped strings, renames with MUTATE, contained JSON to Evidence/privacy notes.

**Deny:** upstream bridge in mcp.json; non-loopback server URL; OpenClaw wire; alwaysApply RE rules; enable without chat `APPROVAL_NEEDED: ghidra-mcp enable-mcp`.

## Operator enable checklist

1. Merge seam PRs / pull `ghidra_mcp_gated.py`.
2. Install Ghidra + GhidraMCP **plugin** (HTTP API); pin compatible versions.
3. Confirm plugin **127.0.0.1** only; pick free port if 8080 busy → set `GHIDRA_MCP_SERVER`.
4. Chat: `APPROVAL_NEEDED: ghidra-mcp enable-mcp — workspace only, gated server, no global mirror, no OpenClaw`.
5. Merge [`.cursor/mcp.ghidra.example.json`](../../.cursor/mcp.ghidra.example.json) `ghidra` block into workspace mcp.json (**leave APPROVE unset**).
6. Per session: chat approval → set `GHIDRA_MCP_APPROVE=1` (and MUTATE if renaming) → analyze → unset.
7. Ungated smoke: `ghidra_gate_status`.

## Harness audit (updated)

| Touchpoint | Status |
|------------|--------|
| SCP on responses | **Enforced in** `ghidra_mcp_gated.py` |
| Env approve/mutate | **Enforced** (credential-vault pattern) |
| Loopback URL | **Enforced** |
| Live mcp.json | Still opt-in via `enable-mcp` |
| OpenClaw | Still deny |
| cyber_policy | Guidance section above |

## Related

- [DETECTION_ENGINE_DESIGN.md](DETECTION_ENGINE_DESIGN.md)
- [secure-contain-protect skill](../../.cursor/skills/secure-contain-protect/SKILL.md)
- [blue-hat-bitcoin skill](../../.cursor/skills/blue-hat-bitcoin/SKILL.md)
- Tests: `local-proto/tests/test_ghidra_mcp_gated.py`
