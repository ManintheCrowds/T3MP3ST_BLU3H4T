# Mission targets vs RoE scope

**Repo:** [T3MP3ST_BLU3H4T](https://github.com/ManintheCrowds/T3MP3ST_BLU3H4T)  
**Related:** [3146cdd-ci-fix.md](../residual-review-findings/3146cdd-ci-fix.md) (TCI-3)

## Definitions

| Field | Location | Meaning |
|-------|----------|---------|
| `rules.scope` | `Mission.rules` / RoE | **Authorized scope patterns** — what the mission *may* touch (CIDR, domain suffix, env `T3MP3ST_AUTHORIZED_SCOPE`, explicit RoE strings). |
| `mission.targets` | `Mission.targets` | **Concrete engagement addresses** — hostnames, URLs, or IPs currently registered for the mission (from `TargetEnvironment.address`). |

## Invariants

1. **Do not copy `rules.scope` into `mission.targets`.** Scope patterns like `10.0.0.0/24` or `.example.com` are not target addresses.
2. **Populate `targets` from `TargetEnvironment`** at mission creation and via `syncMissionTargets` when targets are added mid-mission.
3. **Phase advance (hb-2)** uses `isTargetInAuthorizedScope()` ([scope-match.ts](../../src/governance/scope-match.ts)) to verify each concrete target against `rules.scope`. Empty `targets` does not vacuously pass authorization.

## Wiring

- `TempestCommand.ensureMission()` passes `targets` from `targetEnv.getAllTargets()` and sets `rules.scope` from governance `authorizedScope` when enabled.
- `target:added` calls `syncMissionTargets` on the active mission.
- CLI `createMission` passes registered target addresses.
