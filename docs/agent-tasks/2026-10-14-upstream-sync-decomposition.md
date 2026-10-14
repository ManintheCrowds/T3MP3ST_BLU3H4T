---
title: Agent task pack — upstream sync
date: 2026-10-14
plan: docs/plans/2026-10-14-upstream-sync-merge.md
clone: MiscRepos/T3MP3ST_BLU3H4T
---

# Agent task decomposition: upstream sync

**Do not** use GitHub’s “Discard 28 commits to match upstream.”  
**Do** work on branch `sync/upstream-2026-10-14` (create from `origin/main` if missing).  
**Remotes:** `origin` = ManintheCrowds/T3MP3ST_BLU3H4T · `upstream` = elder-plinius/T3MP3ST.

## Bootstrap (every agent)

```powershell
cd <repo>
git fetch origin upstream --prune
git checkout sync/upstream-2026-10-14
# if missing:
# git checkout -b sync/upstream-2026-10-14 origin/main
git merge upstream/main
# resolve only YOUR cluster files; leave others conflicted or pause for next agent
```

If merge already started: `git status` and finish only assigned paths.

Conflict policy: [plan settled decisions](../plans/2026-10-14-upstream-sync-merge.md).

---

## T3M-SYNC-0 — Branch hygiene (parent / this session)

| Field | Value |
|---|---|
| Status | in progress → done when docs PR merged + wireshark branch deleted |
| Owns | local FF main; docs/ghidra remainder PR; delete merged wireshark branch; tag `pre-upstream-sync-2026-10-14` |
| Verify | `origin/main` contains PR #2 tip; GHIDRA tip on main or open PR URL |

## T3M-SYNC-ID — Identity + package + env

| Field | Value |
|---|---|
| Files | `README.md`, `FEATURES.md`, `package.json`, `package-lock.json`, `.env.example` |
| Keep ours | BLU3H4T naming, defensive Quick Start, governance env table, tshark iface gate docs |
| Take theirs | Net-new upstream FEATURES rows / env keys that do not reintroduce Grok or ungated capture |
| Verify | `npm install`; `npm run build`; `npm run verify:docs` if script exists |
| Risk | Medium |

## T3M-SYNC-CI — Workflows

| Field | Value |
|---|---|
| Files | `.github/workflows/ci.yml` (+ any new upstream workflow files — take theirs if absent on ours) |
| Keep ours | `verify:docs` gate, lint/typecheck fixes from `3146cdd` |
| Take theirs | New jobs (release certify, CTF, matrix) if compatible |
| Verify | Push branch; CI green on sync PR |
| Risk | Medium |

## T3M-SYNC-ARS — Arsenal / CLI / config / types

| Field | Value |
|---|---|
| Files | `src/arsenal/catalog.ts`, `src/arsenal/index.ts`, `src/cli.ts`, `src/setup.ts`, `src/config/index.ts`, `src/types/index.ts` |
| Keep ours | tshark tools, SCP on `Arsenal.execute()`, blue-hat catalog framing |
| Take theirs | WPScan parser, known-debt templates, type/API additions |
| Verify | Arsenal unit tests; eslint on touched files |
| Risk | Medium |

## T3M-SYNC-GOV — Governance hotspots (HITL)

| Field | Value |
|---|---|
| Files | `src/agent/index.ts`, `src/evidence/index.ts`, `src/llm/index.ts`, `src/mission/index.ts`, `src/operators/index.ts`, `src/index.ts`, `src/server.ts`, `src/recon/code-ingest.ts` |
| Hard constraint | Preserve TG-1..11 wiring; server governance default **on** |
| Approach | For each conflict hunk: keep SCP/HITL/org-intent call; graft upstream bugfixes beside |
| Verify | `npx vitest run src/__tests__/governance-gates.test.ts`; `npm run build` |
| Risk | **High** — human review before merge |
| Gate | `APPROVAL_NEEDED: merge T3M-SYNC-GOV into main` if any HITL path changes behavior |

## T3M-SYNC-ABSORB — Upstream-only trees (no conflict)

After conflicted files are clean, ensure merge brought in upstream-only paths (`.aiwg/`, new CTF labs, Dockerfile, etc.). Spot-check:

```powershell
git diff --name-status origin/main...HEAD | Select-Object -First 80
```

No resolve needed; confirm they exist and do not break build.

## T3M-SYNC-SHIP — PR + lineage

| Field | Value |
|---|---|
| Depends on | ID, CI, ARS, GOV, ABSORB |
| Steps | Complete merge commit; update `docs/FORK_LINEAGE.md` (upstream tip + date); open PR; babysit CI; human merges |
| Verify | `git merge-base --is-ancestor upstream/main HEAD` |

---

## Parallelism

```
T3M-SYNC-0 (serial first)
    → start merge on sync/upstream-2026-10-14
    → T3M-SYNC-ID || T3M-SYNC-CI || T3M-SYNC-ARS  (same branch, sequential commits preferred to avoid thrash)
    → T3M-SYNC-GOV (after ARS types stable)
    → T3M-SYNC-ABSORB
    → T3M-SYNC-SHIP
```

Prefer **one agent per cluster, one commit per cluster** on the shared sync branch.

## Prompt stubs (copy into new chats)

**ID agent:**  
`Implement T3M-SYNC-ID from T3MP3ST_BLU3H4T/docs/agent-tasks/2026-10-14-upstream-sync-decomposition.md. Plan: docs/plans/2026-10-14-upstream-sync-merge.md. Resolve only identity/package/env conflict files on sync/upstream-2026-10-14.`

**GOV agent:**  
`Implement T3M-SYNC-GOV from …decomposition.md. Do not drop SCP/HITL/org-intent. Stop for APPROVAL_NEEDED before merging to main.`
