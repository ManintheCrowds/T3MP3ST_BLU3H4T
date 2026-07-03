# Phase 3: Response & Deception Design

## Overview

RESPONDER and DECEIVER operators provide active defense capabilities.
All destructive or externally-visible actions require HITL gates.

---

## RESPONDER — Graduated Incident Response

### Response Tiers

All actions are gated by risk tier and HITL approval:

| Tier | Actions | Gate |
|---|---|---|
| **Observe** (Low) | Log enrichment, IOC collection, timeline construction | No gate |
| **Contain** (Med) | IP block (firewall rule), session invalidation, rate limiting | Scope check |
| **Isolate** (High) | Host network isolation, service shutdown, credential rotation | APPROVAL_NEEDED |
| **Eradicate** (High) | Malware removal, backdoor cleanup, config restoration | APPROVAL_NEEDED |
| **Restore** (High) | Service restart, failover, backup restoration | APPROVAL_NEEDED |

### Incident Lifecycle

```
Detection (SENTINEL/WATCHER)
  │
  ▼
Triage ──► RESPONDER classifies severity + scope
  │
  ▼
Contain ──► Block attacker IP, isolate host (HITL gated)
  │
  ▼
Investigate ──► HUNTER searches for lateral movement
  │
  ▼
Eradicate ──► Remove threat artifacts (HITL gated)
  │
  ▼
Restore ──► Return to known-good state (HITL gated)
  │
  ▼
Report ──► ANALYST generates incident report
```

### Evidence Preservation

Before any containment or eradication action, RESPONDER must:

1. Capture current state (memory dump, disk snapshot, network connections)
2. Log all evidence to Evidence Vault with forensic timestamps
3. Record the action taken and its justification
4. Chain of custody: every evidence artifact has provenance

### Alerting Engine

Notifications sent via configured channels:

| Channel | Configuration | Use case |
|---|---|---|
| Webhook | URL + auth token | Generic integration (PagerDuty, etc.) |
| Slack | Webhook URL or Bot token | Team notifications |
| Email | SMTP config | Management notifications |
| Console | War Room SSE | Real-time SOC dashboard |

Alert format:

```json
{
  "severity": "critical",
  "title": "SQL injection attempt detected",
  "source": "WATCHER",
  "mitre": "T1190",
  "target": "api.internal.example.com",
  "evidence_id": "ev-12345",
  "recommended_response": "Block source IP, review WAF rules",
  "hitl_required": true
}
```

---

## DECEIVER — Deception Technology

### Deception Types

| Type | Implementation | Detection signal |
|---|---|---|
| **Honeyport** | Open port that logs all connections | Any connection is suspicious |
| **Honeyweb** | Fake web app with login form | Any login attempt is an attack |
| **Honeytoken** | Fake API key/credential in known locations | Any use = credential theft |
| **Canary file** | File in common enumeration paths | Any access = directory traversal |
| **Canary DNS** | DNS record that should never be queried | Any query = DNS enum |

### Deployment Strategy

DECEIVER deploys decoys based on SENTINEL's attack surface map:

1. **Mirror real services**: Decoys look like production (same headers, banners)
2. **Place in attacker paths**: Directories that fuzzers enumerate, ports that
   scanners check, files that crawlers request
3. **Tag internally**: All decoys have metadata tags so defenders know they're
   fake (never confuse SOC analysts)
4. **High-fidelity alerting**: Any interaction with a decoy is by definition
   suspicious — zero legitimate traffic should touch them

### Honeytoken Patterns

| Token type | Placement | Detection |
|---|---|---|
| AWS access key | `.env.example`, config files | CloudTrail alert on use |
| GitHub token | `.git/config`, README (internal) | GitHub API audit log |
| Database URI | Config, environment vars | Connection attempt to non-existent DB |
| API key | Headers, query params | API gateway access log |

### HITL Gate

Deployment of new decoys requires APPROVAL_NEEDED because:

- Decoys consume resources (ports, DNS records, endpoints)
- Poorly placed decoys may confuse legitimate users or processes
- Decoy credentials must be tracked to prevent accidental production use

---

## Continuous Monitoring Mode

Reframed from Tempest VISION.md Vector 4:

```
┌─── Continuous Loop ───┐
│                        │
│  SENTINEL: scan attack │──► Delta: new exposure? Alert.
│  surface every N min   │
│                        │
│  WATCHER: analyze new  │──► Pattern: known TTP? Correlate.
│  logs since last cycle │
│                        │
│  HUNTER: check IOC     │──► IOC hit? RESPONDER triage.
│  feeds against state   │
│                        │
│  ANALYST: generate     │──► Report: daily threat summary.
│  periodic summary      │
│                        │
└─── sleep(interval) ───┘
```

Interval is configurable: real-time (SSE streaming) for SOC teams,
hourly/daily for smaller organizations.
