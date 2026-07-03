# Phase 4: Anti-AI Red Team Detection Design

## Overview

The unique differentiator: detect when **autonomous AI agents** are performing
unauthorized security testing against the organization. As AI-powered
offensive tools (T3MP3ST, AutoExploit, PentestGPT, etc.) proliferate,
organizations need defenses specifically designed to recognize and counter
machine-speed attacks.

---

## Threat Model: The Autonomous Red Team

### What makes AI red teams different from human attackers

| Characteristic | Human attacker | AI red team |
|---|---|---|
| Speed | Seconds-minutes between probes | Milliseconds between probes |
| Pattern | Intuitive, non-linear | Systematic, algorithmic |
| Breadth | Focused on promising targets | Exhaustive enumeration |
| Timing | Variable, context-aware | Bursty (ReAct loop: think-act-think) |
| User-Agent | Varies, often mimics browsers | Often default tool UA or identical across requests |
| Error handling | Adapts to errors naturally | Retries with fixed backoff patterns |
| Kill chain | May skip phases | Follows framework's phase model sequentially |

### Known AI Red Team Frameworks

| Framework | Signature patterns |
|---|---|
| T3MP3ST (this upstream) | 8-operator kill chain, ReAct tool loop, Pliny Special tool names |
| PentestGPT | GPT-driven sequential testing, structured output parsing |
| AutoExploit | Metasploit integration, rapid exploit cycling |
| XBOW | 104-challenge benchmark suite patterns |
| Generic LLM agent | ReAct loop timing (pause 1-3s → burst of requests → pause) |

---

## Detection Techniques

### 1. Traffic Pattern Analysis

**Target:** Detect machine-speed, algorithmic probing.

| Pattern | Detection rule | Confidence |
|---|---|---|
| > 10 distinct port probes in < 5 seconds from single IP | Automated scanner | High |
| Sequential directory requests matching common wordlist order | Fuzzing tool | High |
| DNS queries for > 50 subdomains in < 60 seconds | Subdomain enumeration | High |
| HTTP requests with identical headers across different endpoints | Tool-generated traffic | Medium |
| Request burst → 1-5s pause → request burst | ReAct loop cadence | Medium |
| Requests to honeypot-only paths interleaved with real paths | Automated crawl | High |

**Implementation:** WATCHER operator analyzes access logs with sliding window.

### 2. ReAct Loop Fingerprinting

AI agents using the ReAct pattern (Reason → Act → Observe) produce
characteristic traffic timing:

```
[LLM thinks: 1-5 seconds]
[Tool call: immediate HTTP request]
[Wait for response: variable]
[LLM thinks: 1-5 seconds]
[Tool call: immediate HTTP request]
...
```

This produces a distinctive **bimodal timing distribution**: short intervals
(tool execution) alternating with longer intervals (LLM inference). Human
attackers produce **unimodal** or **irregular** timing.

**Detection:** Compute inter-request interval histogram. Bimodal with modes
at ~0.1s and ~2-5s = likely AI agent.

### 3. Kill Chain Sequence Detection

Frameworks that follow structured phases produce predictable sequences:

```
Phase 1: DNS enum → subdomain brute → whois
Phase 2: Port scan → service fingerprint → banner grab
Phase 3: Directory brute → parameter fuzz → payload injection
```

This sequential, phase-complete behavior differs from human attackers who
skip, revisit, and improvise.

**Detection:** Model attack sequences as n-grams. Match against known
framework phase models.

### 4. Prompt Injection Defense (AI-on-AI)

Protect the organization's own AI systems from adversarial prompt injection:

| Attack vector | Defense |
|---|---|
| Injection via web form → org's chatbot | SCP pipeline on all user input |
| Injection via email → org's email AI | SCP pipeline on email body before processing |
| Injection via API response → org's agent | SCP pipeline on all external API responses |
| Injection via DNS TXT record | SCP pipeline on DNS resolution results |
| Injection via HTTP headers | SCP pipeline on response headers |

The SCP client (`src/governance/scp-client.ts`) already handles inline
inspection for override phrases, hidden Unicode, and delimiter injection.
Extend with:

- Organization-specific trigger patterns
- Model-specific jailbreak signatures
- Output validation for the org's own AI responses (detect compromised output)

### 5. Counter-Intelligence: Framework Identification

When an attack is detected, identify which framework is being used:

| Evidence | Framework likelihood |
|---|---|
| Tool calls match T3MP3ST Arsenal tool names in logs | T3MP3ST |
| Requests contain Pliny Special payload patterns | T3MP3ST |
| Exploit attempts follow Metasploit module patterns | Metasploit/AutoExploit |
| Traffic matches Cobalt Strike beacon timing | Cobalt Strike |
| Requests contain nuclei template identifiers | Nuclei |

**Value:** Framework identification helps predict next steps and choose
targeted defenses.

---

## Implementation Architecture

```
┌─── AI Red Team Detector ───┐
│                              │
│  ┌──────────────────────┐   │
│  │ Traffic Analyzer      │   │  ← Access logs, firewall logs
│  │ (timing, patterns)    │   │
│  ├──────────────────────┤   │
│  │ ReAct Fingerprinter   │   │  ← Inter-request timing analysis
│  │ (bimodal detection)   │   │
│  ├──────────────────────┤   │
│  │ Kill Chain Sequencer  │   │  ← Request sequence n-gram matching
│  │ (phase detection)     │   │
│  ├──────────────────────┤   │
│  │ Framework Identifier  │   │  ← Tool/payload signature matching
│  │ (attribution)         │   │
│  ├──────────────────────┤   │
│  │ Prompt Injection      │   │  ← SCP pipeline on all AI-facing input
│  │ Monitor               │   │
│  └──────────────────────┘   │
│                              │
│  Output:                     │
│  - AI agent detected (Y/N)  │
│  - Framework (if identified) │
│  - Kill chain phase          │
│  - Predicted next action     │
│  - Recommended response      │
└─────────────────────────────┘
```

---

## Response Playbook: AI Red Team Detected

When WATCHER detects an autonomous AI red team:

1. **Alert** (immediate): Notify SOC via configured channels
2. **Classify** (WATCHER): Identify framework, current phase, likely objectives
3. **Predict** (WATCHER): Based on kill chain phase, predict next actions
4. **Deceive** (DECEIVER): Deploy targeted honeypots in the attacker's
   predicted path — waste their token budget on fake data
5. **Contain** (RESPONDER, HITL-gated): Rate-limit or block the source
6. **Document** (ANALYST): Full incident report with AI agent attribution

### Token Budget Exhaustion (unique to AI attackers)

AI agents have a finite token/cost budget. DECEIVER can exploit this:

- Return verbose, realistic-looking but fake data from honeypots
- Force the AI agent to process large amounts of decoy information
- Each fake finding the agent "discovers" costs tokens and wastes time
- The attacker's human operator sees mounting costs for zero real findings

---

## Metrics

| Metric | Target |
|---|---|
| AI agent detection rate | > 90% of automated scanners |
| False positive rate (human classified as AI) | < 5% |
| Framework identification accuracy | > 70% for known frameworks |
| Mean time to detect AI red team | < 60 seconds from first probe |
| Kill chain phase prediction accuracy | > 60% |
