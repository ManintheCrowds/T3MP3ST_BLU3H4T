# Pliny Specials — Defensive Rename (EP-3)

**Status:** Implemented 2026-07-06  
**Code:** [`src/pliny/defensive_aliases.ts`](../src/pliny/defensive_aliases.ts)

Legacy **Pliny Special** names remain in MCP tool IDs and retired API paths for backward compatibility. User-facing and defensive documentation uses the **Defensive name** column.

| Legacy | Defensive | Role |
|--------|-----------|------|
| LEVIATHAN | MISSION_SPINE | Mission orchestration (GUARDIAN) |
| SPHINX | VALIDATOR | Purple-team validation |
| GORGON | EXPOSURE_TESTER | Scoped exposure verification |
| CERBERUS | BASTION | Privilege boundary testing |
| TYPHON | SIGNATURE_ENCODER | Detection signature encoding |
| GRIFFIN | DETECTOR | Credential leak detection |
| SIMURGH | RESEARCHER | Threat research |
| HYDRA | MULTI_VECTOR | Multi-vector scenario analysis |
| ARACHNE | CHAIN_ANALYST | Attack-chain pattern analysis |

**MCP:** Each row exposes `mcpToolLegacy` and `mcpToolDefensive` in `defensive_aliases.ts`. New integrations should prefer `defensive_*` tool names.

**Schema:** New payloads may use `blu3hat.t3mp3st_*` schema versions; existing `plinyos.t3mp3st_*` strings in `server.ts` remain valid for stored state.
