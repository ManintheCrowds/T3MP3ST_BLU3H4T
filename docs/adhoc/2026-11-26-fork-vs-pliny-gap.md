# Fork vs Pliny gap analysis

**As-of:** 2026-11-26  
**Fork:** `origin` = https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T (`origin/main` @ `ea65cfb`)  
**Upstream:** `upstream` = https://github.com/elder-plinius/T3MP3ST (`upstream/main` @ `29824d5`)  
**Sync vehicle:** `sync/upstream-2026-10-14` @ `9cb25ab`

## Counts

| Axis | Value |
|------|-------|
| Merge-base | `5255000` (`Update README.md`) |
| Pliny-only (`origin/main..upstream/main`) | **190** commits |
| Fork-only (`upstream/main..origin/main`) | **36** commits |
| Sync ahead of `origin/main` | **196** |
| Sync behind `origin/main` | **8** |
| Sync contains `upstream/main`? | **Yes** (ancestor) |
| Sync contains `origin/main`? | **No** |

## Pliny-only (summary)

Not on BlueHat `main`: CTF labs, arsenal/WPScan work, mission lifecycle / source certification, DFIR/CVE vault shells, threat-feed / honeytoken / Supabase persistence, and related CI/docs from Pliny `main` since the diverge point.

## Fork-only (summary)

BlueHat identity and defensive pivot: SCP client iterations, governance/detection redesign, README/`verify:docs` gate, Ghidra/REA MCP SCP seams, tshark/Wireshark arsenal, MCP SDK bump, Node pin (CVE-2026-111497), shaded banners / xAI drop, Pliny Specials defensive renaming.

## Sync branch role

`sync/upstream-2026-10-14` already carries all of Pliny `main` plus ~34 CI/hygiene commits on top. It is missing the latest ~8 BlueHat commits that landed on `origin/main` after the sync tip (Node pin, MCP SDK, GHIDRA/REA docs remainder).

## Recommendation

1. Land [PR #7](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T/pull/7) (`feat/blu3h4t-defensive-guards`) on `origin/main` after CI green (human merge).
2. Merge `origin/main` into `sync/upstream-2026-10-14` (absorb the 8+ BlueHat commits, including #7 once merged).
3. Open sync → `main` PR on the fork (`--repo ManintheCrowds/T3MP3ST_BLU3H4T`). High-risk large delta; do not merge without explicit approval.
4. Do **not** force-push `main` or open cross-repo PRs to Pliny unless separately approved.

## Related

- Defensive cut PR: https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T/pull/7
- Plans: `docs/plans/2026-11-26-0041-feat-asset-investigation-graphs-plan.md`, `docs/plans/2026-11-26-0126-feat-scanner-hunt-guard-plan.md`
