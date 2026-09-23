# GhidraMCP + SCP seam

**Status:** Documented opt-in · **Risk:** High · **Live MCP:** disabled by default  
**Audience:** Blue Hat Tempest operators, harness agents, Blue Hat Bitcoin privacy review  
**Plan:** [docs/plans/2026-09-23-002-feat-ghidra-mcp-scp-seam-plan.md](../../docs/plans/2026-09-23-002-feat-ghidra-mcp-scp-seam-plan.md)

## Purpose

Compose [Ghidra](https://github.com/NationalSecurityAgency/ghidra) with [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP) ([setup writeup](https://0xresetti.github.io/ghidramcp.html)) as a **human-gated, localhost static-analysis sidecar** for authorized binaries. Every string leaving the bridge toward LLM context, handoff, or state must pass **SCP** first.

This is **defensive SRE / evidence enrichment**, not an autonomous analysis bot and not an offensive reverse-engineering playbook.

## Architecture

```
authorized binary (human loads in Ghidra)
        │
        ▼
Ghidra + GhidraMCPPlugin  ──HTTP──►  127.0.0.1:<port>
        │
        ▼
bridge_mcp_ghidra.py  (stdio MCP; prefer audit_wrapper)
        │
        ▼
Cursor agent tools
        │
        ▼
scp_run_pipeline(sink=llm_context|handoff|state)
        │
        ├── injection → block + optional quarantine
        ├── reversal  → sanitize → contain
        └── clean     → contain (treat as data)
        │
        ▼
contained summary → Evidence note / privacy review (never raw dumps in handoff)
```

**Containment split:** Ghidra contains the binary process; SCP contains **text extracted** from it (decomp, strings, comments, symbols).

## Risk tier and HITL

| Item | Value |
|------|--------|
| Risk tier | **High** ([TOOL_SAFEGUARDS](../../local-proto/docs/TOOL_SAFEGUARDS.md)) |
| Before any GhidraMCP tool use | Output `APPROVAL_NEEDED: ghidra-mcp [action]` and wait |
| Goal vs constraint conflict | `ESCALATE` — stop |
| Ambiguous authorization / scope | `REQUEST_HUMAN` — stop |
| Capability High/Critical (Bitcoin spend/PII) | `verify_capability` + human gate (blue-hat-bitcoin) |
| Canonical HITL literals | [local-proto/config/hitl_gate_substrings.txt](../../local-proto/config/hitl_gate_substrings.txt) |

Do not enable the example MCP server in live `.cursor/mcp.json` without a separate operator approval turn.

## SCP pipeline (required)

Before feeding GhidraMCP tool output to the model or persisting to handoff/state:

```text
scp_run_pipeline(content, sink="llm_context")   # or handoff / state
```

| Sink | When |
|------|------|
| `llm_context` | Before the agent reasons over decomp/strings |
| `handoff` / `state` | Before writing session continuity or Evidence prose |

Prefer existing SCP MCP tools (`scp_inspect`, `scp_sanitize`, `scp_contain`, `scp_quarantine`). Do not invent a second classifier for this source.

Optional: `document_provenance_record` (or hash + source note) for the binary under analysis when the review is durable.

## Allow / deny

**Allow (after approval):**

- Overview: imports/exports, string inventory, rename for readability
- Contained summaries for Tempest Evidence or privacy review
- Loopback-only HTTP (`127.0.0.1`)

**Deny by default:**

- Enabling MCP without `APPROVAL_NEEDED`
- Binding the Ghidra HTTP server beyond loopback
- Persisting raw decompilation into `handoff_latest` / always-on rules
- OpenClaw / remote wire in this seam (separate `#10b`-class approval)
- Exploit/PoC generation, unpack attack procedures, unauthorized third-party binaries
- Always-on Cursor rules that dump RE vocabulary into every Anthropic turn

## Operator enable checklist (off-repo)

1. Install a **Ghidra build compatible with the chosen GhidraMCP release** (upstream extension often lags latest Ghidra — pin deliberately).
2. Install GhidraMCP extension ZIP via Ghidra **File → Install Extensions** (use the extension ZIP *inside* the release archive when nested).
3. Enable **GhidraMCPPlugin** under **File → Configure → Developer**; restart as needed.
4. Confirm HTTP server is **127.0.0.1** only; check port (default often **8080** — avoid collisions with other local services).
5. `pip install "mcp[cli]"` for the bridge Python env.
6. Copy [`.cursor/mcp.ghidra.example.json`](../../.cursor/mcp.ghidra.example.json) paths to absolute `bridge_mcp_ghidra.py` + `audit_wrapper.py`.
7. Output `APPROVAL_NEEDED: ghidra-mcp enable-mcp` — only then merge into live MCP config / restart Cursor.
8. Load an **authorized** binary; agent work stays overview-scoped; SCP every outbound text blob.

Deferred: evaluating maintained forks (e.g. broader Ghidra version support) — not required to use this seam.

## Harness audit (2026-09-23)

| Touchpoint | Present today | Gap | Action (this seam) |
|------------|---------------|-----|--------------------|
| `.cursor/mcp.json` | Many servers via `audit_wrapper` | No GhidraMCP | Example only — not live-enabled |
| SCP MCP | Full pipeline | Not named for binary bridge output | This doc + skill pointer |
| TOOL_SAFEGUARDS | High tier examples | GhidraMCP unnamed | Add High example |
| MCP_SERVERS / CAPABILITY_INDEX / MCP_CAPABILITY_MAP | Discovery SSOT | No Ghidra row | Document opt-in |
| blue-hat-bitcoin skill | SCP for chain data | No binary static path | Compose With + link |
| T3MP3ST Evidence / detection | Log/payload/ATT&CK strong | No binary sidecar doc | FEATURES checkbox + this note |
| OpenClaw Tier-1 | #10a verified; #10b gated | Must not silent-wire Ghidra | Explicit deny here |
| cyber_policy separation | Security-dense material kept lean | RE tutorials risk classifier | Keep this note short/defensive |

**Verdict:** Integrate as **documented High-risk opt-in + SCP**; do not treat as core Tempest detection engine or always-on MCP.

## Related

- [DETECTION_ENGINE_DESIGN.md](DETECTION_ENGINE_DESIGN.md) — log/payload detection (complement, not replace)
- [secure-contain-protect skill](../../.cursor/skills/secure-contain-protect/SKILL.md)
- [blue-hat-bitcoin skill](../../.cursor/skills/blue-hat-bitcoin/SKILL.md)
- [MCP_SERVERS.md](../../local-proto/docs/MCP_SERVERS.md)
- [TOOL_SAFEGUARDS.md](../../local-proto/docs/TOOL_SAFEGUARDS.md)
