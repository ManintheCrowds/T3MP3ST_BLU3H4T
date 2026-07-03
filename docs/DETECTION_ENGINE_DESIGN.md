# Phase 2: Detection Engine Design

## Overview

The detection engine inverts Tempest's OPSEC layer. Where the original system
tracks detection events to *avoid* them, BLU3H4T tracks detection events to
*generate* them. The payload databases become detection signatures. The ATT&CK
mappings become detection rules.

---

## Architecture

```
                    ┌─────────────────────────┐
                    │   DETECTION ENGINE       │
                    │                          │
  Log/Traffic  ──►  │  ┌──────────────────┐   │  ──► Findings (Evidence Vault)
  Feeds             │  │ Pattern Matcher   │   │
                    │  │ (payload DB sigs) │   │  ──► Alerts (webhook/Slack)
  SIEM Alerts  ──►  │  ├──────────────────┤   │
                    │  │ ATT&CK Detector   │   │  ──► WATCHER Analysis
  Network Data ──►  │  │ (technique sigs)  │   │
                    │  ├──────────────────┤   │  ──► RESPONDER Trigger
  DNS Logs     ──►  │  │ Anomaly Engine    │   │
                    │  │ (behavioral)      │   │
                    │  ├──────────────────┤   │
                    │  │ AI Agent Detector  │   │
                    │  │ (traffic finger-  │   │
                    │  │  prints)           │   │
                    │  └──────────────────┘   │
                    └─────────────────────────┘
```

## Component 1: Payload Database → Detection Signatures

Tempest ships 200+ payloads (SQLi, XSS, SSTI, LFI, SSRF, command injection,
XXE). Each payload is a known attack string. Inverted, these become WAF
detection rules.

**Implementation:** `src/detection/signatures.ts`

Convert each payload category into detection patterns:

| Category | Payload example | Detection rule |
|---|---|---|
| SQLi UNION | `' UNION SELECT NULL--` | Match `UNION\s+SELECT` in query params, POST body, headers |
| XSS reflected | `<script>alert(1)</script>` | Match `<script` or event handlers in reflected content |
| SSTI Jinja2 | `{{7*7}}` | Match template syntax `{{`, `{%` in user input |
| LFI traversal | `../../../../etc/passwd` | Match repeated `../` sequences in path params |
| SSRF cloud | `http://169.254.169.254/` | Match cloud metadata IP ranges in URL params |
| XXE | `<!DOCTYPE foo [<!ENTITY` | Match DOCTYPE/ENTITY declarations in XML input |

**Conversion function:**

```typescript
function payloadToDetectionRule(payload: string, category: string): DetectionRule {
  // Escape regex special chars, create anchored pattern
  // Return { pattern, category, severity, mitreId, description }
}
```

## Component 2: MITRE ATT&CK → Detection Rules

Tempest maps 40+ ATT&CK techniques. Each technique has known indicators.
Add D3FEND countermeasure mappings.

| ATT&CK | Technique | Detection indicator | D3FEND countermeasure |
|---|---|---|---|
| T1595 | Active Scanning | Port scan patterns in firewall logs | D3-NTA (Network Traffic Analysis) |
| T1190 | Exploit Public App | Payload patterns in WAF/access logs | D3-WAF (Web Application Firewall) |
| T1078 | Valid Accounts | Anomalous authentication (time, location) | D3-ANET (Authentication Event Thresholding) |
| T1046 | Network Service Scan | Sequential port probing from single IP | D3-PM (Port Monitoring) |
| T1059 | Command Execution | Unusual process execution chains | D3-PSA (Process Spawn Analysis) |

## Component 3: SIEM/IDS Connectors

Operator-based connectors that ingest data from organizational security tools:

| Connector | Protocol | Data type |
|---|---|---|
| Wazuh | REST API / Syslog | Host-based IDS alerts |
| Suricata | EVE JSON / Syslog | Network IDS alerts |
| Elasticsearch (ELK) | REST API | Aggregated log data |
| Splunk | REST API / HEC | Aggregated log data |
| Syslog (generic) | UDP/TCP 514 | Raw log lines |

Each connector is an Arsenal tool registered with the WATCHER operator:

```typescript
arsenal.register({
  name: 'wazuh_alerts',
  category: 'detection',
  description: 'Fetch recent Wazuh alerts',
  execute: async (params, context) => {
    // REST API call to Wazuh manager
    return { success: true, data: { alerts: [...] } };
  }
});
```

## Component 4: Anomaly Engine

Behavioral detection that doesn't rely on signatures:

- **Request rate anomaly**: Sudden spike in requests from a single IP
- **Access pattern anomaly**: Requests to unusual paths (admin panels, backup files)
- **Time anomaly**: Activity outside business hours from internal IPs
- **Volume anomaly**: Unusual data transfer volumes (exfiltration indicator)
- **Sequential anomaly**: Systematic enumeration patterns (alphabetical dirs)

---

## OPSEC Layer Inversion

The existing `src/opsec/index.ts` OpsecController tracks:

- Detection events (with type and severity)
- Abort threshold
- IOC tracking

**Defensive inversion:**

| Original concept | Offensive use | Defensive use |
|---|---|---|
| Detection event | "We were detected — increase cooldown" | "We detected an attack — raise alert" |
| Abort threshold | "Too many detections — stop attacking" | "Too many attacks — escalate to RESPONDER" |
| IOC tracking | "Track our indicators to clean up" | "Track attacker indicators for investigation" |
| Cooldown | "Wait before next probe to avoid detection" | N/A (we want continuous monitoring) |
| Traffic blending | "Blend our traffic with legitimate" | "Identify traffic that's trying to blend" |

---

## Priority and phasing

| Component | Priority | Dependencies |
|---|---|---|
| Payload → detection signatures | P0 | Existing payload DB |
| ATT&CK → detection rules | P0 | Existing technique mappings |
| SIEM connector (Wazuh) | P1 | External Wazuh instance |
| SIEM connector (ELK) | P1 | External ELK stack |
| Anomaly engine | P1 | Baseline data collection |
| AI agent detector | P0 | See Phase 4 design |
