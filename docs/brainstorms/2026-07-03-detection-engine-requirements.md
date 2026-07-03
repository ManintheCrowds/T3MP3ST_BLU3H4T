# Detection Engine — Phase 2 Requirements

## Outcomes

1. The T3MP3ST BLU3H4T platform detects known attack patterns (payload signatures, ATT&CK techniques) against monitored infrastructure in near-real-time.
2. Behavioral anomalies that evade signature-based detection are surfaced with tunable confidence thresholds.
3. Autonomous AI red team agents are identified and distinguished from human attackers.
4. Findings flow through the governance stack (SCP, HITL, risk tiers) into the Evidence Vault and trigger appropriate operator responses.
5. At least one SIEM/IDS connector (Wazuh or ELK) is operational at MVP.

## Success Criteria

- Detection coverage: ≥ 80% of Tempest's 200+ payload categories produce active detection rules.
- ATT&CK technique mapping: ≥ 40 techniques have detection indicators with D3FEND countermeasure annotations.
- AI agent detection rate: > 90% of automated scanners, < 5% false positive on human traffic.
- Mean time to detect (MTTD): < 60 seconds from first probe for AI agents; < 5 minutes for signature-matched attacks.
- SIEM connector: at least one connector ingests live data and produces correlated findings in the Evidence Vault.
- Anomaly engine: baseline establishment completes within configurable observation window; at least 3 anomaly types operational (rate, pattern, timing).

## Recommended Approach: Event Bus with Detection Registry

### Approach A — Event Bus with Detection Registry

All detectors (signature matcher, ATT&CK rule engine, anomaly engine, AI agent detector) publish to a central `DetectionBus` (EventEmitter-based, matching codebase patterns). SIEM connectors are ingest adapters that normalize external data onto the bus. Operators subscribe by interest (WATCHER gets all, SENTINEL gets recon-class, RESPONDER gets critical-only). The bus handles deduplication, severity escalation, and governance routing.

**Pros:**
- Matches existing EventEmitter architecture (OpsecController, Arsenal, EvidenceVault all use it)
- Loose coupling — detectors and consumers are independent; new detectors slot in without changing consumers
- Natural composition with governance stack (bus emits to SCP gate before Evidence Vault persistence)
- Supports both real-time streaming and polled/batch ingest via the same interface

**Cons:**
- Bus becomes a single coordination point (must handle backpressure if connector volume is high)
- Correlation across detectors requires a separate correlation layer on the bus
- More infrastructure than just extending OpsecController

**Key risks:** Event ordering under high volume; correlation logic complexity.
**Best suited:** Multi-connector deployments, extensible detection rule ecosystem, team-based defensive operations.

### Approach B — Layered Pipeline (Ingest → Normalize → Detect → Correlate → Route)

Sequential pipeline where data flows through stages. Connectors are ingest adapters, normalization produces a common event format, detection is a parallel fan-out to all rule engines, correlation merges findings, routing delivers to operators.

**Pros:**
- Clear data flow, easy to reason about ordering and transformation
- Natural backpressure (each stage can buffer)
- Good for batch/offline analysis of historical logs

**Cons:**
- Rigid — adding a new detector requires touching the pipeline orchestrator
- Doesn't compose well with the existing EventEmitter patterns (forces a different paradigm)
- Real-time latency suffers at each pipeline stage
- Over-engineered for MVP when connector count is 1-2

**Key risks:** Latency in multi-stage processing; pipeline orchestrator becomes monolithic.
**Best suited:** High-throughput environments with well-defined data formats and batch processing needs.

### Approach C — Dual-Mode OpsecController Extension

Extend the existing `OpsecController` with a `mode: 'offensive' | 'defensive'` flag. In defensive mode, the same `recordDetection` method creates alerts instead of evasion signals. IOC tracking flips to tracking attacker indicators. Connectors feed directly into the controller.

**Pros:**
- Minimal new code — reuses existing class and event system
- Clean conceptual inversion (same primitives, opposite semantics)
- Fast to implement for MVP

**Cons:**
- Tight coupling between offensive and defensive logic in one class (violates SRP as complexity grows)
- OpsecController's API (cooldown, jitter, abort threshold) doesn't cleanly map to defensive needs
- Hard to scale beyond simple detection — anomaly engine and AI detection don't fit the opsec abstraction
- Becomes a god object as detection capabilities grow

**Key risks:** Architectural ceiling hit quickly; dual-mode flag produces confusing conditional logic.
**Best suited:** Rapid prototype or proof-of-concept only.

### Recommendation

**Approach A (Event Bus with Detection Registry)** — it extends the codebase's existing EventEmitter idiom, keeps detectors and consumers decoupled, composes naturally with governance, and scales to the full detection engine scope without architectural rewrites. The OpsecController remains unchanged for offensive mode; the detection engine is a parallel subsystem that shares type definitions (DetectionEvent, IOC) but not class hierarchy.

## Scope Boundaries

### In scope (Phase 2)
- Payload-to-signature conversion (compile-time generation with runtime hot-reload)
- ATT&CK technique → detection rule mapping with D3FEND annotations
- Detection bus infrastructure and operator routing
- Wazuh and ELK connectors as Arsenal tools (WATCHER category)
- Statistical anomaly engine (rate, pattern, timing, volume, sequential)
- AI agent detector (traffic timing, ReAct fingerprint, kill chain sequencing)
- Evidence Vault integration for all findings
- Governance stack integration (SCP gate on ingest, HITL for response actions)

### Deferred for later
- Suricata, Splunk, and generic Syslog connectors (Phase 2.5)
- ML-based anomaly detection (requires baseline data from statistical engine)
- Active response automation (rate-limiting, IP blocking) beyond HITL-gated manual response
- Multi-tenant detection (per-org baselines, per-org rules)
- Detection rule marketplace or community rule sharing
- SOAR integration (automated playbook execution)

### Out of scope
- Modifying the offensive OpsecController — it stays as-is
- Building a full SIEM replacement — connectors consume from existing SIEMs
- Network packet capture or deep packet inspection — we ingest processed logs
- Endpoint agent deployment — we consume host-based IDS output, not raw telemetry

## Dependencies

| Dependency | Type | Risk |
|---|---|---|
| Existing payload databases (200+ payloads in `src/stubs/` and Arsenal tools) | Internal, exists | Low — verified present |
| ATT&CK technique mappings (40+ in offensive operator profiles) | Internal, exists | Low — verified in defensive.ts |
| EventEmitter3 library | Internal, exists | None |
| Evidence Vault and SCP gate | Internal, exists | None — already SCP-gated |
| External Wazuh instance for connector testing | External | Medium — requires test environment |
| External ELK stack for connector testing | External | Medium — requires test environment |
| Baseline traffic data for anomaly engine tuning | Operational | Medium — cannot validate without real traffic |

## Assumptions

- Signature generation is a build-time compilation step (payload DB → rule files), with optional runtime hot-reload for urgency.
- SIEM connectors authenticate via API keys or tokens managed by the operator (not stored in code).
- The anomaly engine's initial baselines will be established from synthetic or historical data before production deployment.
- Detection rules use a multi-format approach: internal TypeScript rule objects for the engine, with export capability to Sigma (for portability) and YARA (for file-based detection) as secondary outputs.
- The AI agent detector operates on access log analysis — it does not require inline network tap.

## Outstanding Questions (Require Human Input)

1. **Rule format priority:** Should Sigma export be a first-class requirement for MVP, or is the internal TypeScript rule format sufficient with Sigma as a follow-on? This affects connector design (Sigma-native SIEMs can import rules directly vs needing a translation layer).

2. **Connector credential management:** Should connector credentials flow through the existing governance stack (SCP-gated secrets), or should we integrate with an external secret manager (Vault, AWS Secrets Manager)? This affects deployment topology.

3. **Anomaly baseline source:** For MVP testing, should the anomaly engine bootstrap from (a) synthetic traffic generated by Tempest's own offensive tools in a test loop, (b) historical log imports from a real environment, or (c) a configurable observation window on live traffic? Option (a) is self-contained but may not represent real-world patterns.

4. **AI agent detection confidence threshold:** When the AI detector reaches "medium confidence" (e.g., bimodal timing but no framework signature match), should it alert immediately or wait for corroborating signals? This is a false-positive tolerance decision that affects SOC noise.

5. **Detection bus persistence:** Should the detection bus be in-memory only (findings persist only when they reach the Evidence Vault), or should bus events be durably queued (Redis, file-based) to survive process restarts? Affects complexity and deployment requirements.
