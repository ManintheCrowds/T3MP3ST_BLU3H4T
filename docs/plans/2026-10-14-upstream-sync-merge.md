---
title: Upstream sync and branch merge (BLU3H4T)
date: 2026-10-14
status: implementation-ready
execution: software
repo: ManintheCrowds/T3MP3ST_BLU3H4T
upstream: elder-plinius/T3MP3ST
---

# Plan: Sync and merge T3MP3ST_BLU3H4T with upstream

## Goal

Bring `origin/main` current with `upstream/main` **without discarding** the fork’s 28 blue-hat commits, close stale feature branches, and leave remaining conflict work as agent-sized tasks.

## Settled decisions (session)

| Decision | Provenance | Rejected | Reason |
|---|---|---|---|
| Preserve all 28 fork commits; never “Discard 28 commits to match upstream” | user-directed (fork identity + GitHub UI option shown) | Reset main to upstream | Governance / detection / blue-hat identity live only on fork |
| Integrate via **merge** (sync branch → PR → main), not rebase of public main | user-directed (“sync and merge”) | Rebase main onto upstream | Keeps public history; safer for already-pushed merges |
| Prefer **ours** for blue-hat identity surfaces (README banner/identity, FEATURES defensive framing, package metadata name/description) when conflicted; take **theirs** for net-new upstream arsenal/CTF/bench when no semantic clash | user-directed (FORK_LINEAGE) | Prefer theirs globally | Upstream is red-team product; fork is blue-hat |
| Full 20-file conflict resolve may be agent-decomposed across PRs | user-directed (“task decompose … for future agents”) | One monolithic silent resolve | Risk surface; HITL on governance-touching files |

## Observed state (2026-10-14 fetch)

| Ref | Ahead | Behind | Notes |
|---|---:|---:|---|
| `origin/main` vs `upstream/main` | 28 | 190 | merge-base `5255000` |
| local `main` vs `origin/main` | 0 | 6 | need fast-forward (includes PR #1, #2) |
| `cursor/wireshark-tshark-arsenal-f973` vs `origin/main` | 0 | 1 | already merged via PR #2 — delete after confirm |
| `docs/ghidra-mcp-scp-seam` vs `origin/main` | 1 | 4 | tip `7a8108b` not on main; local WIP: GHIDRA edit + untracked `REA_MCP_SCP_SEAM.md` |

### Conflict surface (`changed in both` = 20)

`.env.example`, `.github/workflows/ci.yml`, `FEATURES.md`, `README.md`, `package.json`, `package-lock.json`, `src/agent/index.ts`, `src/arsenal/catalog.ts`, `src/arsenal/index.ts`, `src/cli.ts`, `src/config/index.ts`, `src/evidence/index.ts`, `src/index.ts`, `src/llm/index.ts`, `src/mission/index.ts`, `src/operators/index.ts`, `src/recon/code-ingest.ts`, `src/server.ts`, `src/setup.ts`, `src/types/index.ts`

## Work units

### Phase A — this run (hygiene + durable pack)

1. Tag `pre-upstream-sync-2026-10-14` on `origin/main` tip after FF.
2. Fast-forward local `main` to `origin/main`.
3. Land docs remainder: cherry-pick/merge `7a8108b` + commit REA/GHIDRA WIP onto a short-lived branch; open PR → merge if green.
4. Delete remote `cursor/wireshark-tshark-arsenal-f973` after confirm tip ⊆ main.
5. Write conflict map + agent task pack under `docs/agent-tasks/`.
6. Create `sync/upstream-2026-10-14` from `origin/main` (no force-push; no discard).

### Phase B — agent cluster: identity + config (T3M-SYNC-ID)

Resolve: `README.md`, `FEATURES.md`, `package.json`, `package-lock.json` (regenerate lock after json), `.env.example`.  
Verify: `npm run verify:docs` (if present), `npm run build`.

### Phase C — agent cluster: CI (T3M-SYNC-CI)

Resolve: `.github/workflows/ci.yml`. Keep fork `verify:docs` / governance gates; adopt upstream job matrix improvements.  
Verify: push and watch CI.

### Phase D — agent cluster: arsenal + types (T3M-SYNC-ARS)

Resolve: `src/arsenal/*`, `src/types/index.ts`, `src/cli.ts`, `src/setup.ts`, `src/config/index.ts`. Preserve tshark arsenal + SCP gates; absorb WPScan / known-debt templates from upstream.  
Verify: unit tests touching arsenal; `npm run lint` scoped.

### Phase E — agent cluster: governance wiring hotspots (T3M-SYNC-GOV) — High risk

Resolve: `src/agent/index.ts`, `src/evidence/index.ts`, `src/llm/index.ts`, `src/mission/index.ts`, `src/operators/index.ts`, `src/index.ts`, `src/server.ts`, `src/recon/code-ingest.ts`.  
**Constraint:** do not drop SCP / org-intent / HITL / risk-tier wiring (TG-1..11). Prefer ours for governance call sites; graft upstream behavioral fixes beside them.  
Verify: `src/__tests__/governance-gates.test.ts` + typecheck.

### Phase F — close-out (T3M-SYNC-SHIP)

1. Finish merge commit on `sync/upstream-2026-10-14`.
2. Update `docs/FORK_LINEAGE.md` with sync as-of + upstream tip SHA.
3. PR → main; babysit CI; human merge.
4. Update MiscRepos `pending_tasks.md` rows to done.

## Out of scope / forbidden

- Discarding the 28 fork commits.
- Force-push to `main`.
- Disabling governance defaults on War Room (`T3MP3ST_GOVERNANCE` remains on by default).
- Live xAI/Grok models (fork already dropped; do not reintroduce from upstream).

## Verification (definition of done for sync PR)

- [ ] `git merge-base --is-ancestor upstream/main HEAD` true on sync branch after merge commit
- [ ] `npm run build` and project CI green
- [ ] Governance tests pass
- [ ] README still presents BLU3H4T defensive identity
- [ ] No secrets in commit

## Rollback

`git reset --hard pre-upstream-sync-2026-10-14` on the sync branch (local); close unmerged PR. Main untouched until PR merge.

## Agent task index

See [../agent-tasks/2026-10-14-upstream-sync-decomposition.md](../agent-tasks/2026-10-14-upstream-sync-decomposition.md).
