/**
 * PURPOSE: Defensive display names and MCP aliases for legacy Pliny Specials (EP-3).
 * DEPENDENCIES: T3MP3ST_BLU3H4T defensive pivot; COMPARATIVE_ANALYSIS.md
 * Legacy offensive names remain as API/MCP keys for backward compatibility.
 */

export type PlinyLegacyId =
  | 'leviathan'
  | 'sphinx'
  | 'gorgon'
  | 'cerberus'
  | 'typhon'
  | 'griffin'
  | 'simurgh'
  | 'hydra'
  | 'arachne';

export type DefensiveSpecialId =
  | 'mission_spine'
  | 'validator'
  | 'exposure_tester'
  | 'bastion'
  | 'signature_encoder'
  | 'detector'
  | 'researcher'
  | 'multi_vector'
  | 'chain_analyst';

export interface DefensiveSpecialMeta {
  legacyId: PlinyLegacyId;
  legacyName: string;
  defensiveId: DefensiveSpecialId;
  defensiveName: string;
  defensiveRole: string;
  mcpToolLegacy: string;
  mcpToolDefensive: string;
  d3fend?: string;
}

/** EP-3 canonical rename map (offensive → defensive). */
export const PLINY_DEFENSIVE_ALIASES: readonly DefensiveSpecialMeta[] = [
  {
    legacyId: 'leviathan',
    legacyName: 'LEVIATHAN',
    defensiveId: 'mission_spine',
    defensiveName: 'MISSION_SPINE',
    defensiveRole: 'Defensive mission orchestration (GUARDIAN lane)',
    mcpToolLegacy: 'pliny_leviathan',
    mcpToolDefensive: 'defensive_mission_spine',
    d3fend: 'Governance',
  },
  {
    legacyId: 'sphinx',
    legacyName: 'SPHINX',
    defensiveId: 'validator',
    defensiveName: 'VALIDATOR',
    defensiveRole: 'Purple-team vulnerability validation',
    mcpToolLegacy: 'pliny_sphinx',
    mcpToolDefensive: 'defensive_validator',
    d3fend: 'D3-TE',
  },
  {
    legacyId: 'gorgon',
    legacyName: 'GORGON',
    defensiveId: 'exposure_tester',
    defensiveName: 'EXPOSURE_TESTER',
    defensiveRole: 'Scoped exposure verification (not exploitation)',
    mcpToolLegacy: 'pliny_gorgon',
    mcpToolDefensive: 'defensive_exposure_tester',
    d3fend: 'D3-TE',
  },
  {
    legacyId: 'cerberus',
    legacyName: 'CERBERUS',
    defensiveId: 'bastion',
    defensiveName: 'BASTION',
    defensiveRole: 'Privilege boundary and escalation-path testing',
    mcpToolLegacy: 'pliny_cerberus',
    mcpToolDefensive: 'defensive_bastion',
    d3fend: 'D3-TE',
  },
  {
    legacyId: 'typhon',
    legacyName: 'TYPHON',
    defensiveId: 'signature_encoder',
    defensiveName: 'SIGNATURE_ENCODER',
    defensiveRole: 'Payload encoding for detection signatures and WAF rules',
    mcpToolLegacy: 'pliny_typhon',
    mcpToolDefensive: 'defensive_signature_encoder',
    d3fend: 'D3-DA',
  },
  {
    legacyId: 'griffin',
    legacyName: 'GRIFFIN',
    defensiveId: 'detector',
    defensiveName: 'DETECTOR',
    defensiveRole: 'Secret and credential leak detection',
    mcpToolLegacy: 'pliny_griffin',
    mcpToolDefensive: 'defensive_detector',
    d3fend: 'D3-DA',
  },
  {
    legacyId: 'simurgh',
    legacyName: 'SIMURGH',
    defensiveId: 'researcher',
    defensiveName: 'RESEARCHER',
    defensiveRole: 'Threat research and attack-surface analysis',
    mcpToolLegacy: 'pliny_simurgh',
    mcpToolDefensive: 'defensive_researcher',
    d3fend: 'D3-TE',
  },
  {
    legacyId: 'hydra',
    legacyName: 'HYDRA',
    defensiveId: 'multi_vector',
    defensiveName: 'MULTI_VECTOR',
    defensiveRole: 'Multi-vector defensive scenario analysis',
    mcpToolLegacy: 'pliny_hydra',
    mcpToolDefensive: 'defensive_multi_vector',
    d3fend: 'D3-TE',
  },
  {
    legacyId: 'arachne',
    legacyName: 'ARACHNE',
    defensiveId: 'chain_analyst',
    defensiveName: 'CHAIN_ANALYST',
    defensiveRole: 'Attack-chain pattern analysis for detection',
    mcpToolLegacy: 'pliny_arachne',
    mcpToolDefensive: 'defensive_chain_analyst',
    d3fend: 'D3-DA',
  },
] as const;

const byLegacy = new Map(
  PLINY_DEFENSIVE_ALIASES.map((row) => [row.legacyId, row] as const),
);

export function resolveDefensiveSpecial(legacyId: PlinyLegacyId): DefensiveSpecialMeta {
  const row = byLegacy.get(legacyId);
  if (!row) {
    throw new Error(`unknown Pliny legacy id: ${legacyId}`);
  }
  return row;
}

export function defensiveDisplayName(legacyName: string): string {
  const key = legacyName.toLowerCase() as PlinyLegacyId;
  const row = byLegacy.get(key);
  return row ? row.defensiveName : legacyName;
}

/** Schema version suffix for new defensive payloads (plinyos.* retained for compat). */
export const BLU3HAT_SCHEMA_PREFIX = 'blu3hat.t3mp3st';
