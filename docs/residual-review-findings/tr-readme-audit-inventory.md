# TR README re-audit inventory (2026-07-07)

**Base:** fork `main` @ `825c7aa`  
**Scope:** README.md, FEATURES.md, package.json, core design docs  
**Editorial intent:** Blue-hat teleology; user docs must not require red-hat framing.

---

## 0a. Red-hat phrase inventory

| File | Location | Phrase / section | Proposal |
|------|----------|------------------|----------|
| README.md | What is BLU3H4T | "inverts the offensive kill chain" / "attack pipeline (recon → exploit → exfil)" | **Reframe** — lead with detect/validate/respond + governance-first |
| README.md | Bullet 3 | "Anti-AI red team" as product identity | **Reframe** — "AI attacker detection" (threat model, not operator role) |
| README.md | § Operator-to-operator mapping | Full offensive→defensive ATT&CK table | **Move** → [FORK_LINEAGE.md](../FORK_LINEAGE.md) (contributor reference) |
| README.md | § What this inherits | "offensive infrastructure remains available" lead | **Reframe** — link to fork lineage; blue-primary upstream table |
| README.md | Detection diagram | "ATT&CK rules" as user-facing label | **Keep** — describes detected attacker behavior |
| FEATURES.md | §3 Operator System | 8 offensive archetypes (RECON, EXPLOITER…) as primary table | **Reframe** — defensive operators §20 primary; §3 labeled "legacy/upstream offensive modules" |
| FEATURES.md | Events | `target:owned`, `credential:harvested` | **Keep** — accurate event names; add note "internal API" |
| AI_REDTEAM_TECHNIQUES.md | Title/§1 | "red-team specialist" | **Keep** — documents attack techniques for detection corpus |
| ANTI_AI_REDTEAM_DESIGN.md | Intro | Threat = AI attackers | **Reframe** intro — defender/WATCHER perspective |
| defensive.ts (code) | Comments | "INVERT the offensive kill chain" | **Keep** — contributor code comment |

**Approved default:** Apply reframe/move per Proposal column (plan editorial direction).

---

## 0b. Claims inventory (CI-verified targets)

| Claim | README/FEATURES | Verified source | Canonical value |
|-------|-----------------|-----------------|-----------------|
| Defensive operators | 8 | `Object.keys(DEFENSIVE_ARCHETYPE_PROFILES)` in `src/operators/defensive.ts` | **8** |
| Detection subsystem files | 13 | `src/detection/**/*.ts` (excl. tests) | **13** |
| Governance modules | 4 named + scope-match | `src/governance/*.ts` | **6** files; **4** user-facing pillars (SCP, org-intent, HITL, risk tiers) + scope-match |
| AI technique playbook | 18-technique | `docs/AI_REDTEAM_TECHNIQUES.md` §2.1–§2.18 | **18** (not 17) |
| org-intent boundaries | hb-1..hb-5 | `src/governance/org-intent.ts` | **5** |
| CI workflow steps | (not in README today) | `.github/workflows/ci.yml` `run:` steps | **11** after `verify:docs` gate (was 10) |
| package repository | ManintheCrowds fork | `package.json` `repository.url` | **ManintheCrowds/T3MP3ST_BLU3H4T** |

**Drift fixed:** Profile/handoff "17 techniques" → standardize on **18** per `AI_REDTEAM_TECHNIQUES.md`.

---

## 0c. Link + drift inventory

### Missing from README docs table (add)

- [mission-targets-semantics.md](../governance/mission-targets-semantics.md)
- [FORK_LINEAGE.md](../FORK_LINEAGE.md) (new)
- [PLINY_DEFENSIVE_RENAME.md](../PLINY_DEFENSIVE_RENAME.md) (optional contributor)

### Residual docs (link from CONTRIBUTING or governance section, not main table)

- [3146cdd-ci-fix.md](./3146cdd-ci-fix.md)
- [eslint-warning-debt.md](./eslint-warning-debt.md)

### package.json

- `description`, `keywords`, `repository.url`, `blu3h4t` bin — **aligned** (no change required unless verify script tightens)

### Quick Start gap

- War Room path: present
- Programmatic path: present
- CLI smoke path: **missing** — add `npm run build && npx t3mp3st test` or `npm run doctor`

---

## Implementation checklist

- [x] Inventory (this file)
- [ ] `scripts/verify-readme-docs.mjs` + CI gate
- [ ] README / FEATURES / package.json / banner
- [ ] FORK_LINEAGE.md + design doc intros
- [ ] Harness TR-* reset → done
