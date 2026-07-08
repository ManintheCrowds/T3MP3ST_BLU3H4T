# ESLint warning debt (TCI-4)

**Date:** 2026-07-07  
**Repo:** [ManintheCrowds/T3MP3ST_BLU3H4T](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T)  
**Baseline (pre-TCI-4):** 176 warnings, 0 errors  
**Related:** [3146cdd-ci-fix.md](./3146cdd-ci-fix.md)

## Summary by rule (baseline)

| Rule | Count | Notes |
|------|-------|-------|
| `@typescript-eslint/no-explicit-any` | ~143 | Dominant in `server.ts` Express handlers |
| `@typescript-eslint/no-non-null-assertion` | ~20 | Tests + legacy modules |
| `@typescript-eslint/no-unused-vars` | ~4 | Mostly catch bindings |

## By file (baseline)

| File | Warnings | Status |
|------|----------|--------|
| `src/server.ts` | ~101 | **Deferred** — 7k-line API surface; non-blocking in CI |
| `src/general/index.ts` | ~18 | Deferred — OpGeneral JSON/plan typing |
| `src/__tests__/code-ingest.test.ts` | ~12 | Deferred — test fixtures |
| `src/__tests__/governance-gates.test.ts` | ~9 | **Fixed** in TCI-4 (requireMission helper) |
| `src/integrations/bounty.ts` | ~8 | Deferred |
| Other modules | ≤4 each | **Partially fixed** (cli, setup, org-intent, correlator, code-ingest, spine-live, index) |

## TCI-4 actions taken

- Fixed high-signal warnings outside `server.ts` in small modules (unused vars, non-null assertions, `any` in setup/cli).
- Did **not** add blanket `eslint-disable` for `server.ts`.
- CI gate `npm run lint` remains **warnings-tolerant** (errors block; warnings do not).

## Recommended future work

1. **server.ts** — Introduce typed request/response helpers per route group (missions, targets, general/admiral) incrementally; avoid big-bang refactor.
2. **general/index.ts** — Type OpPlan JSON parse boundaries with Zod or narrow interfaces.
3. **Tests** — Replace fixture `any` with minimal typed stubs where tests touch external APIs.

## Verification

```bash
npm run lint   # 0 errors; ~140+ warnings expected until server.ts pass
npm run typecheck && npm test
```
