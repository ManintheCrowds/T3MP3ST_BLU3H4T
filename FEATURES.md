# T3MP3ST BLU3H4T Feature Documentation

> Autonomous blue team defense platform with governance-first multi-agent security

**Legend:**
- [x] Implemented and working
- [~] Partially implemented / stub
- [ ] Planned / ideal feature

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [LLM Backbone](#2-llm-backbone)
3. [Operator System (Agents)](#3-operator-system-agents)
4. [Mission Control](#4-mission-control)
5. [Target Environment](#5-target-environment)
6. [Arsenal (Tools)](#6-arsenal-tools)
7. [Pliny Specials](#7-pliny-specials)
8. [Evidence Vault](#8-evidence-vault)
9. [OPSEC Layer](#9-opsec-layer)
10. [Communications](#10-communications)
11. [Analysis & Reporting](#11-analysis--reporting)
12. [CLI Interface](#12-cli-interface)
13. [API Server](#13-api-server)
14. [MCP Server (Agent Integration)](#14-mcp-server-agent-integration)
15. [Web UI Dashboard](#15-web-ui-dashboard)
16. [Advanced Modules](#16-advanced-modules)
17. [Configuration System](#17-configuration-system)
18. [Integration & Extensibility](#18-integration--extensibility)
19. [Governance Stack](#19-governance-stack)
20. [Defensive Operators](#20-defensive-operators)
21. [Detection Engine](#21-detection-engine)
22. [AI Red Team Detection](#22-ai-red-team-detection)

---

## 1. Core Architecture

### TempestCommand Orchestrator
- [x] Central command class extending EventEmitter
- [x] Lifecycle management (start, stop, pause, resume)
- [x] Tick-based execution loop
- [x] Event emission for all major actions
- [x] Status reporting and health checks
- [~] Hooks system for lifecycle events
- [ ] Distributed command across multiple nodes
- [ ] State persistence and recovery after crash

### Factory Functions
- [x] `createTempest()` - Standard operation
- [x] `createTestTempest()` - Testing with mock LLM
- [x] `createAutoTempest()` - Auto-configured with best available LLM
- [x] `createStealthOperation()` - Silent OPSEC preset
- [x] `createAggressiveOperation()` - Loud OPSEC preset
- [ ] `createDistributedTempest()` - Multi-node operation
- [ ] `createCloudTempest()` - Cloud-native deployment

### Event System
- [x] `command:started` / `command:stopped`
- [x] `command:paused` / `command:resumed`
- [x] `operator:spawned` / `operator:burned`
- [x] `finding:discovered`
- [x] `credential:harvested`
- [x] `target:owned`
- [x] `detection:triggered`
- [x] `mission:phase_changed`
- [x] `abort:recommended`
- [ ] `chain:completed` - Full kill chain success
- [ ] `exfil:complete` - Data exfiltration finished

---

## 2. LLM Backbone

### Provider Support
- [x] **OpenRouter** - Multi-model gateway (50+ models)
- [x] **Anthropic** - Direct Claude API
- [x] **OpenAI** - GPT models
- [x] **Mock** - Testing without API
- [x] **Local** - Ollama support
- [ ] **Azure OpenAI** - Enterprise deployment
- [ ] **AWS Bedrock** - Claude via AWS
- [ ] **Google Vertex AI** - Gemini via GCP

### Model Registry (50+ models configured)
- [x] Claude Opus 4.5, Sonnet 4.5, Sonnet 4
- [x] GPT-4o, GPT-4 Turbo, o1
- [x] Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Flash
- [x] Grok 4, Grok 4 Fast, Grok 4.1 Fast
- [x] DeepSeek R1, DeepSeek V3
- [x] Llama 3.3 70B
- [x] Mistral Large
- [x] GLM 4.7

### LLM Features
- [x] Chat completion with retry logic
- [x] Conversation history management
- [x] System prompt configuration
- [x] Streaming responses (OpenRouter)
- [x] Token usage tracking
- [x] Provider validation
- [x] Automatic provider selection
- [ ] Function calling / tool use
- [ ] Vision/multimodal support
- [ ] Embeddings for semantic search
- [ ] Fine-tuned model support
- [ ] Cost tracking and budgeting

---

## 3. Operator System (Agents)

### 8 Operator Archetypes
| Archetype | Phase | MITRE Tactics | Status |
|-----------|-------|---------------|--------|
| **RECON** | Reconnaissance | TA0043 | [x] Implemented |
| **SCANNER** | Discovery | TA0007 | [x] Implemented |
| **EXPLOITER** | Initial Access | TA0001, TA0002 | [x] Implemented |
| **INFILTRATOR** | Lateral Movement | TA0008, TA0004 | [x] Implemented |
| **EXFILTRATOR** | Exfiltration | TA0009, TA0010 | [x] Implemented |
| **GHOST** | Persistence | TA0003, TA0005 | [x] Implemented |
| **COORDINATOR** | C2 | TA0011 | [x] Implemented |
| **ANALYST** | Reporting | - | [x] Implemented |

### Operator Features
- [x] State management (idle, tasked, executing, cooldown, burned)
- [x] Task assignment and completion tracking
- [x] Detection risk monitoring
- [x] Cooldown management
- [x] Finding and credential recording
- [x] Archetype-specific system prompts
- [x] MITRE ATT&CK technique mapping
- [~] Autonomous decision making via LLM
- [ ] Inter-operator coordination
- [ ] Learning from past engagements
- [ ] Skill leveling system
- [ ] Custom archetype creation

### Team Factories
- [x] `createBalancedTeam()` - General purpose
- [x] `createStealthTeam()` - Minimal detection
- [x] `createBreachTeam()` - Aggressive initial access
- [ ] `createAPTTeam()` - Advanced persistent threat simulation
- [ ] `createInsiderTeam()` - Insider threat simulation
- [ ] `createCloudTeam()` - Cloud-focused operations

### Operator Cell Management
- [x] Spawn/despawn operators
- [x] Status aggregation
- [x] Count by status
- [ ] Automatic scaling based on workload
- [ ] Operator health monitoring
- [ ] Failover and replacement

---

## 4. Mission Control

### Mission Lifecycle
- [x] Create mission with objectives
- [x] Start/pause/resume/complete/abort
- [x] Rules of Engagement (RoE) enforcement
- [x] Phase transitions
- [~] Objective tracking and completion
- [ ] Mission templates
- [ ] Multi-mission management
- [ ] Mission scheduling

### Task Queue
- [x] Priority-based task management
- [x] Add/remove tasks
- [x] Get next task (global or by archetype)
- [x] Status updates
- [x] Mission-scoped task queries
- [ ] Task dependencies
- [ ] Parallel task execution
- [ ] Task retry with backoff
- [ ] Deadline enforcement

### Rules of Engagement
- [x] Scope definition (in-scope targets)
- [x] Forbidden techniques list
- [x] Detection event limits
- [x] `createDefaultRoE()` preset
- [x] `createStrictRoE()` preset
- [ ] Time-based restrictions
- [ ] Geographic restrictions
- [ ] Data handling rules
- [ ] Escalation procedures

### Kill Chain Phases
- [x] RECON - Reconnaissance
- [x] WEAPONIZE - Weaponization
- [x] DELIVER - Delivery
- [x] EXPLOIT - Exploitation
- [x] INSTALL - Installation
- [x] C2 - Command & Control
- [x] ACTIONS_ON_OBJECTIVES - Actions on Objectives
- [x] Phase-to-archetype mapping
- [ ] Custom phase definitions
- [ ] Phase-specific tooling

---

## 5. Target Environment

### Target Management
- [x] Add/update/remove targets
- [x] Status transitions (discovered → scanning → vulnerable → exploited → owned)
- [x] Zone classification (external, dmz, internal, restricted)
- [x] Type classification (web_app, api, server, network_device, etc.)
- [x] Service and vulnerability tracking
- [x] Statistics aggregation
- [ ] Asset discovery automation
- [ ] Network topology mapping
- [ ] Relationship tracking between targets

### Target Factories
- [x] `createTargetFromUrl()` - Parse URL into target
- [x] `createTargetFromIP()` - Create from IP address
- [x] `createDMZArchitecture()` - Sample architecture
- [ ] `importFromNmap()` - Import from Nmap XML
- [ ] `importFromShodan()` - Import from Shodan
- [ ] `importFromCloud()` - Import from AWS/GCP/Azure

### Target Types
- [x] web_application
- [x] api
- [x] server
- [x] workstation
- [x] network_device
- [x] database
- [x] cloud_service
- [x] container
- [x] iot_device
- [x] mobile_app

---

## 6. Arsenal (Tools)

### Built-in Tools
- [x] `dns_lookup` - DNS resolution with multiple record types
- [x] `port_scan` - Port scanning with service detection
- [x] `http_request` - Full HTTP client with headers/body
- [x] `subdomain_enum` - Subdomain enumeration
- [x] `dir_bruteforce` - Directory bruteforcing with wordlists
- [x] `whois_lookup` - Domain WHOIS lookup
- [x] `header_analysis` - Security header analyzer
- [x] `technology_detect` - Tech stack fingerprinting
- [x] `xss_scan` - XSS vulnerability testing
- [x] `sqli_scan` - SQL injection testing
- [x] `ssl_scan` - TLS/SSL configuration analysis
- [x] `password_spray` - Common password testing
- [x] `hash_crack` - Hash identification and cracking
- [x] `base64_decode` - Base64 decoding utility
- [x] `jwt_decode` - JWT analysis with security checks
- [ ] `vuln_scan` - Comprehensive vulnerability scanning
- [ ] `exploit_search` - Exploit database search

### Tool Management
- [x] Tool registration
- [x] Category-based filtering
- [x] Tool execution with context
- [x] Execution history tracking
- [x] Custom tool support
- [ ] Tool chaining
- [ ] Tool output parsing
- [ ] Tool version management
- [ ] Tool health checks

### Whitelisted CLI Tools (via API)
- [x] nmap, curl, wget, dig, host, whois
- [x] nikto, gobuster, ffuf, dirb
- [x] sqlmap, wfuzz, hydra
- [x] openssl, base64, xxd, strings
- [x] file, exiftool, binwalk
- [ ] nuclei, subfinder, amass
- [ ] metasploit integration
- [ ] burp suite integration

---

## 7. Pliny Specials

### The Nine Pliny Specials

| Tool | Power | Type | Status |
|------|-------|------|--------|
| **LEVIATHAN** | 99 | Kill Chain Orchestrator | [x] MCP + API |
| **SPHINX** | 88 | Vulnerability Validator | [x] MCP + API |
| **GORGON** | 92 | Precision Exploitation | [x] MCP + API |
| **CERBERUS** | 85 | Privilege Escalation | [x] MCP + API |
| **TYPHON** | 90 | Payload Encoding | [x] MCP + API |
| **GRIFFIN** | 95 | Secret Harvesting | [x] MCP + API |
| **SIMURGH** | 100 | Zero-Day Research | [x] MCP + API |
| **HYDRA** | 85 | Multi-Vector Attacks | [x] MCP + API + UI |
| **ARACHNE** | 87 | Exploit Chaining | [x] MCP + API + UI |

### LEVIATHAN Features
- [x] Engagement planning
- [x] Phase orchestration
- [x] Tool recommendations
- [x] Autonomy levels (FULL, GUIDED, MANUAL)
- [ ] Real-time execution
- [ ] Progress tracking
- [ ] Abort/rollback capability

### SPHINX Features
- [x] Finding analysis
- [x] False positive elimination
- [x] PoC generation
- [x] Confidence scoring
- [ ] Integration with major scanners
- [ ] Automated retesting
- [ ] Finding deduplication

### GORGON Features
- [x] Payload selection
- [x] Delivery method planning
- [x] Stealth rating calculation
- [x] Mode selection (surgical, aggressive, stealth)
- [ ] Actual exploit execution
- [ ] Session management
- [ ] Post-exploitation hooks

### TYPHON Features
- [x] URL encoding (single/double)
- [x] Base64 encoding
- [x] Hex encoding
- [x] Unicode escaping
- [x] HTML entity encoding
- [x] WAF bypass techniques
- [ ] Custom encoding chains
- [ ] Context-aware encoding
- [ ] Encoding detection/decode

### GRIFFIN Features
- [x] JWT extraction and decoding
- [x] AWS credential detection
- [x] GitHub token detection
- [x] API key extraction
- [x] Password pattern matching
- [x] Private key detection
- [ ] Cloud credential validation
- [ ] Token expiry checking
- [ ] Credential spraying integration

### SIMURGH Features
- [x] Vulnerability class targeting
- [x] Protection analysis
- [x] Attack surface mapping
- [x] Exploitation primitive identification
- [ ] Fuzzer integration
- [ ] Crash analysis
- [ ] Exploit development assistance

### CERBERUS Features
- [x] Linux privesc vectors (sudo, SUID, kernel, cron)
- [x] Windows privesc vectors (UAC, services, tokens)
- [x] Confidence scoring
- [x] Recommended execution order
- [ ] Automated enumeration
- [ ] Exploit suggestion
- [ ] Success probability calculation

### HYDRA Features
- [x] Multi-vector coordination with 14 attack vectors
- [x] Parallel attack planning with configurable heads
- [x] Vector selection (SQLi, XSS, SSRF, SSTI, LFI, RCE, etc.)
- [x] Priority scoring based on target type
- [x] API integration for enhanced analysis
- [x] Web UI integration with real-time status
- [x] Comprehensive payload databases per vector
- [ ] Rate limiting
- [ ] Result aggregation
- [ ] Attack surface coverage metrics

### ARACHNE Features
- [x] Chain building from vulnerabilities
- [x] Objective-based pathfinding (14 attack primitives)
- [x] 8 strategic objectives with MITRE ATT&CK mapping
- [x] 18 known exploit chains with CVE mappings
- [x] Reliability and detection risk scoring
- [x] Playbook generation with phases
- [x] API integration for enhanced chains
- [x] Web UI `findChainsEnhanced()` method
- [x] Chain length limits
- [x] Multiple chain generation
- [ ] Graph-based visualization
- [ ] Chain validation

---

## 8. Evidence Vault

### Finding Management
- [x] Create findings with severity
- [x] CVSS score support
- [x] Verification status tracking
- [x] Query by severity/target/operator
- [x] Evidence attachment
- [ ] Finding templates
- [ ] Duplicate detection
- [ ] Finding workflows (triage → verify → report)

### Credential Management
- [x] Credential storage
- [x] Type classification (password, hash, token, key, certificate)
- [x] Source tracking
- [x] Query all credentials
- [ ] Credential validation
- [ ] Password cracking integration
- [ ] Credential rotation detection

### Evidence Types
- [x] Screenshots
- [x] HTTP requests/responses
- [x] Command output
- [x] Files
- [x] Network captures
- [ ] Video recordings
- [ ] Memory dumps
- [ ] Disk images

### Severity Levels
- [x] Critical (score: 10)
- [x] High (score: 7.5)
- [x] Medium (score: 5)
- [x] Low (score: 2.5)
- [x] Info (score: 0)
- [x] CVSS to severity conversion

---

## 9. OPSEC Layer

### OPSEC Levels
- [x] **Silent** - Maximum stealth, 1 detection limit, 5min cooldown
- [x] **Covert** - Balanced, 3 detection limit, 1min cooldown
- [x] **Loud** - Speed priority, 20 detection limit, 2s cooldown

### Detection Management
- [x] Detection event recording
- [x] Abort recommendation threshold
- [x] Cooldown enforcement
- [x] IOC (Indicator of Compromise) tracking
- [ ] Detection pattern analysis
- [ ] Evasion recommendations
- [ ] Real-time alert integration

### OPSEC Features
- [x] Traffic blending option
- [x] Timing jitter
- [x] Logging sanitization
- [x] Cleanup on complete
- [~] Avoid detection heuristics
- [ ] TOR/proxy integration
- [ ] Domain fronting
- [ ] Traffic encryption
- [ ] Decoy traffic generation

### OPSEC Presets
- [x] `createSilentOpsecConfig()`
- [x] `createAggressiveOpsecConfig()`
- [x] `createBalancedOpsecConfig()`
- [ ] `createAPTOpsecConfig()`
- [ ] `createRedTeamOpsecConfig()`

---

## 10. Communications

### Channel Types
- [x] Broadcast - All operators
- [x] Direct - One-to-one
- [x] Team - Group channels
- [ ] Encrypted channels
- [ ] External C2 integration

### Message Types
- [x] Intel - Intelligence sharing
- [x] Task - Task assignments
- [x] Alert - Warnings
- [x] Status - Status updates
- [x] Finding - Finding reports
- [x] Coordination - Team coordination
- [ ] Heartbeat - Health checks
- [ ] Emergency - Critical alerts

### Comms Features
- [x] Channel creation/closure
- [x] Subscription management
- [x] Message routing
- [x] Message history
- [x] Priority levels
- [ ] Message encryption
- [ ] Message acknowledgment
- [ ] Offline message queue

---

## 11. Analysis & Reporting

### Report Types
- [x] Executive summary
- [x] Technical findings
- [x] Full report
- [x] Findings only
- [ ] Compliance report (PCI, HIPAA, SOC2)
- [ ] Remediation report
- [ ] Trend analysis

### Report Features
- [x] Risk rating calculation
- [x] Attack path inference
- [x] Recommendation generation
- [x] Markdown export
- [~] HTML export
- [ ] PDF export
- [ ] DOCX export
- [ ] JSON/XML export

### Analysis Features
- [x] Severity aggregation
- [x] Target coverage analysis
- [x] Finding categorization
- [ ] CVSS calculation
- [ ] Risk scoring models
- [ ] Trend analysis over time
- [ ] Comparison with baselines

### Executive Summary Includes
- [x] Total findings by severity
- [x] Risk rating (Critical/High/Medium/Low)
- [x] Top recommendations
- [x] Key findings highlights
- [ ] Business impact assessment
- [ ] Compliance status
- [ ] Remediation timeline

---

## 12. CLI Interface

### Commands
- [x] `t3mp3st` - Interactive mode (default)
- [x] `t3mp3st setup` - Configuration wizard
- [x] `t3mp3st status` - Show configuration
- [x] `t3mp3st test` - Test LLM connection
- [x] `t3mp3st models` - List available models
- [ ] `t3mp3st run <mission>` - Run mission file
- [ ] `t3mp3st report <output>` - Generate report
- [ ] `t3mp3st import <file>` - Import targets
- [ ] `t3mp3st export <file>` - Export findings

### Interactive Mode Features
- [x] Start new operation (4 presets)
- [x] View status (operators, findings, OPSEC)
- [x] Spawn operator (8 archetypes)
- [x] Add target
- [x] Create mission
- [x] Chat with AI
- [x] Generate report
- [x] Stop operation
- [x] Settings management
- [ ] Mission templates
- [ ] Batch operations
- [ ] Scripting support

### UI Features
- [x] Colored output (chalk)
- [x] ASCII banner (figlet)
- [x] Gradient text
- [x] Progress spinners (ora)
- [x] Interactive prompts (inquirer)
- [x] Table display (cli-table3)
- [x] Box formatting (boxen)

---

## 13. API Server

### Server Configuration
- [x] Express.js server
- [x] Port 3333 (configurable)
- [x] CORS enabled
- [x] JSON body parsing
- [x] Static file serving for UI

### Health Endpoints
- [x] `GET /api/health` - Server health
- [x] `GET /api/llm/status` - LLM connection status

### Pliny Endpoints
- [x] `POST /api/pliny/leviathan/engage` - Kill chain orchestration
- [x] `POST /api/pliny/sphinx/validate` - Vulnerability validation
- [x] `POST /api/pliny/gorgon/strike` - Precision exploitation
- [x] `POST /api/pliny/typhon/inject` - Payload encoding
- [x] `POST /api/pliny/griffin/harvest` - Secret harvesting
- [x] `POST /api/pliny/simurgh/hunt` - Zero-day research
- [x] `POST /api/pliny/cerberus/escalate` - Privilege escalation
- [ ] `POST /api/pliny/hydra/orchestrate` - Multi-vector attacks
- [ ] `POST /api/pliny/arachne/chain` - Exploit chaining

### Tool Endpoints
- [x] `POST /api/tools/execute` - Execute whitelisted tool
- [x] `POST /api/tools/recon` - Quick reconnaissance
- [ ] `GET /api/tools` - List available tools
- [ ] `GET /api/tools/:id/history` - Tool execution history

### LLM Endpoints
- [x] `POST /api/llm/chat` - Chat with LLM
- [ ] `POST /api/llm/stream` - Streaming chat
- [ ] `GET /api/llm/models` - List models

### Missing Endpoints (Planned)
- [ ] `GET /api/operators` - List operators
- [ ] `POST /api/operators` - Spawn operator
- [ ] `DELETE /api/operators/:id` - Remove operator
- [ ] `GET /api/targets` - List targets
- [ ] `POST /api/targets` - Add target
- [ ] `GET /api/findings` - List findings
- [ ] `GET /api/missions` - List missions
- [ ] `POST /api/missions` - Create mission
- [ ] `GET /api/reports` - Generate report

---

## 14. MCP Server (Agent Integration)

### MCP Tools Exposed
- [x] `pliny_leviathan` - Kill chain orchestration
- [x] `pliny_sphinx` - Vulnerability validation
- [x] `pliny_gorgon` - Precision exploitation
- [x] `pliny_cerberus` - Privilege escalation
- [x] `pliny_typhon` - Payload encoding
- [x] `pliny_griffin` - Secret harvesting
- [x] `pliny_simurgh` - Zero-day research
- [x] `pliny_hydra` - Multi-vector attacks
- [x] `pliny_arachne` - Exploit chaining
- [x] `security_recon` - Network reconnaissance

### MCP Features
- [x] Tool definitions with JSON Schema
- [x] Tool execution handlers
- [x] Stdio transport
- [x] Error handling
- [ ] SSE transport
- [ ] WebSocket transport
- [ ] Authentication
- [ ] Rate limiting
- [ ] Usage tracking

### Integration Support
- [x] Claude Desktop configuration
- [x] Claude Code integration
- [ ] ChatGPT plugin format
- [ ] LangChain tools
- [ ] AutoGPT plugins

---

## 15. Web UI Dashboard

### Navigation
- [x] Sidebar navigation
- [x] Section collapse/expand
- [x] Mobile responsive toggle
- [x] Active section highlighting
- [x] Badge indicators

### Dashboard Page
- [x] Kill chain visualization
- [x] Operator swarm status
- [x] Live intel feed
- [x] Statistics cards
- [x] OPSEC monitor
- [x] Quick actions

### Pages Implemented
- [x] Dashboard - Overview
- [x] Operators - Agent management
- [x] Missions - Mission control
- [x] Evidence - Findings vault
- [x] Arsenal - Tool registry
- [x] Terminal - Command execution
- [x] Benchmarks - Performance testing
- [x] Config Library - OPSEC presets
- [x] CTF Range - Practice targets
- [x] Settings - Configuration
- [x] About - Project info

### Visual Features
- [x] Dark cyberpunk theme
- [x] Neon color scheme
- [x] Animated elements
- [x] Grid background
- [x] Progress bars
- [x] Status indicators
- [x] Code syntax highlighting

### Interactive Features
- [x] Real-time updates
- [x] Filter controls
- [x] Modal dialogs
- [x] Toast notifications
- [x] Keyboard shortcuts
- [x] Copy to clipboard
- [x] View source on GitHub links
- [ ] Drag and drop
- [ ] Export functionality
- [ ] Dark/light theme toggle

### Arsenal Features
- [x] Tool cards with stats
- [x] Category filtering
- [x] Search functionality
- [x] Tool info modals
- [x] Code viewer tab
- [x] Stats tab
- [x] Run demo buttons
- [x] Copy code functionality
- [x] View full source links

---

## 16. Advanced Modules

### Module Implementations

| Module | Purpose | Status |
|--------|---------|--------|
| **KnowledgeBase** | CVE/MITRE database | [x] **Full** - 20 CVEs, 40+ MITRE techniques, 15 patterns |
| **EvasionEngine** | Encoding & bypass | [x] **Full** - 10 encoders, obfuscators, WAF bypass |
| ExploitEngine | Payload generation & delivery | [~] Stub |
| ScannerOrchestrator | Multi-scanner coordination | [~] Stub |
| BrowserAutomation | Headless browser control | [~] Stub |
| BenchmarkRunner | Performance testing | [~] Stub |
| ReasoningEngine | Chain-of-thought reasoning | [~] Stub |
| CognitionEngine | Advanced thought patterns | [~] Stub |
| SwarmController | Multi-agent swarm behavior | [~] Stub |
| CloudSecurityEngine | Cloud enumeration | [~] Stub |
| PersistenceController | Implant deployment | [~] Stub |
| LearningEngine | Experience recording | [~] Stub |
| ProtocolHandler | Protocol abstraction | [~] Stub |
| ReportingEngine | Automated reports | [~] Stub |
| WorkflowOrchestrator | Multi-step automation | [~] Stub |

### KnowledgeBase Features (NEW)
- [x] 20 critical CVE entries (Log4Shell, Spring4Shell, ProxyLogon, etc.)
- [x] 40+ MITRE ATT&CK techniques across all tactics
- [x] 15 vulnerability patterns for injection detection
- [x] `query()` - Search CVEs, techniques, patterns
- [x] `getCVE()` / `getTechnique()` - Direct lookups
- [x] `getTechniquesByTactic()` - Filter by MITRE tactic
- [x] `getCriticalCVEs()` - Filter by CVSS threshold
- [x] `matchPatterns()` - Detect vulnerabilities in content

### EvasionEngine Features (NEW)
- [x] 10 encoding schemes: base64, base64url, hex, unicode, rot13, url, html, octal
- [x] Multi-layer encoding with `multiEncode()`
- [x] Code obfuscators: string_split, variable_rename, junk_code
- [x] Sandbox detection (VM, timing, CPU, memory checks)
- [x] `generatePolymorphic()` - Multiple payload variants
- [x] `getWAFBypassVariants()` - WAF evasion techniques

### Planned Advanced Features

#### Cognition Patterns
- [ ] Chain-of-Thought (CoT) reasoning
- [ ] ReAct (Reasoning + Acting)
- [ ] Tree-of-Thought exploration
- [ ] Self-consistency checking
- [ ] Debate mode (multiple perspectives)

#### Swarm Intelligence
- [ ] Pheromone-based communication
- [ ] Emergent behavior coordination
- [ ] Task distribution algorithms
- [ ] Collective decision making

#### Cloud Security
- [ ] AWS enumeration & exploitation
- [ ] GCP security testing
- [ ] Azure penetration testing
- [ ] Multi-cloud support
- [ ] IAM analysis
- [ ] S3/blob storage auditing

#### Persistence & C2
- [ ] Implant generation
- [ ] C2 channel establishment
- [ ] Beacon management
- [ ] Persistence mechanism deployment

#### Learning & Adaptation
- [ ] Experience recording
- [ ] Pattern recognition
- [ ] Technique effectiveness tracking
- [ ] Adaptive strategy selection

---

## 17. Configuration System

### Storage
- [x] Persistent config via Conf library
- [x] Project-scoped storage
- [x] Environment variable loading
- [x] .env file support
- [ ] Config file import/export
- [ ] Config encryption
- [ ] Remote config sync

### API Key Management
- [x] Store/retrieve API keys
- [x] Key validation
- [x] Multi-provider support
- [x] Environment variable precedence
- [ ] Key rotation
- [ ] Key expiry warnings
- [ ] Secure key storage (keychain)

### Provider Configuration
- [x] Base URL customization
- [x] Default model selection
- [x] Site URL/name for OpenRouter
- [x] Timeout configuration
- [x] Temperature settings
- [x] Max tokens configuration

### OPSEC Configuration
- [x] Level presets
- [x] Detection thresholds
- [x] Cooldown settings
- [x] Cleanup preferences

### UI Preferences
- [x] Show/hide banner
- [x] Color output toggle
- [x] Verbose logging toggle
- [ ] Theme selection
- [ ] Custom shortcuts

---

## 18. Integration & Extensibility

### Current Integrations
- [x] OpenRouter API
- [x] Anthropic API
- [x] OpenAI API
- [x] Ollama (local)
- [x] Model Context Protocol (MCP)
- [ ] LangChain
- [ ] AutoGPT
- [ ] BabyAGI

### Extensibility Points
- [x] Custom tools via Arsenal.register()
- [x] Custom operators via createOperator()
- [x] Event hooks via EventEmitter
- [x] Custom LLM providers via adapters
- [ ] Plugin system
- [ ] Webhook notifications
- [ ] External C2 integration
- [ ] SIEM integration

### Export Formats
- [x] JSON (findings, reports)
- [x] Markdown (reports)
- [ ] PDF
- [ ] HTML
- [ ] CSV
- [ ] SARIF (Static Analysis Results)
- [ ] STIX/TAXII (threat intelligence)

### Import Formats
- [ ] Nmap XML
- [ ] Nessus reports
- [ ] Burp XML
- [ ] OWASP ZAP
- [ ] Nuclei JSON
- [ ] Shodan export

---

## 19. Governance Stack

The governance layer that pure offensive frameworks lack. Composes four subsystems gating all content and actions.

Source: `src/governance/` — `scp-client.ts`, `org-intent.ts`, `hitl.ts`, `risk-tiers.ts`

### SCP Pipeline (Secure-Contain-Protect)
- [x] `inspectContent()` — tier classification (injection / reversal / clean)
- [x] `runPipeline()` — inspect → sanitize → contain → quarantine per sink
- [x] `validateOutput()` — gate tool output before return
- [x] `maskSecrets()` — strip secrets from outbound content
- [x] Event emission (`scp:inspected`, `scp:blocked`, `scp:sanitized`, `scp:passed`)
- [x] Configurable quarantine-on-block policy
- [x] Sink-based routing (`handoff`, `state`, `llm_context`, `tool_output`)
- [x] Wired into Arsenal, EvidenceVault, AgentLoop, and LLMBackbone

### Org-Intent (Hard Boundaries)
- [x] 5 hard boundaries (hb-1..hb-5): authorized targets only, human confirmation for active response, no offensive action without scope receipt, data handling compliance, escalation on ambiguity
- [x] `validateMission()` — pre-flight check before mission creation
- [x] `checkBoundaries()` — context-aware boundary enforcement per action
- [x] Wired into MissionControl (`createMission`, `advancePhase`)

### HITL Gates (Human-in-the-Loop)
- [x] `requestApproval()` — gated approval for high-risk tool execution
- [x] `escalate()` — escalate to human when constraints conflict
- [x] `requestGuidance()` — request human decision on ambiguous situations
- [x] Auto-approve-low policy (configurable)
- [x] Timeout-based fallback (configurable `requestTimeoutMs`)
- [x] Wired into OperatorAgent via RiskTierGate checks

### Risk Tiers
- [x] 4-tier gate: Low (pass) / Medium (scope check) / High (APPROVAL_NEEDED) / Critical (team consensus)
- [x] `checkGate()` — per-tool, per-target risk evaluation
- [x] Audit trail for all gate decisions
- [x] Wired into OperatorCell for all current and future operators

---

## 20. Defensive Operators

8 defensive archetypes that invert the offensive kill chain. Each maps to MITRE D3FEND defensive techniques.

Source: `src/operators/defensive.ts`

### 8 Defensive Archetypes

| Archetype | D3FEND | Defends Against | Phase | HITL Required |
|-----------|--------|-----------------|-------|---------------|
| **SENTINEL** | D3-DE | TA0043 (Recon) | Detection | No |
| **WATCHER** | D3-DA | TA0007 (Discovery) | Analysis | No |
| **VALIDATOR** | D3-TE | TA0001 (Initial Access) | Validation | Yes |
| **HUNTER** | D3-TE | TA0008 (Lateral Movement) | Threat Hunting | Yes |
| **RESPONDER** | D3-ER | TA0009 (Exfiltration) | Incident Response | Yes |
| **DECEIVER** | D3-DC | TA0003 (Persistence) | Deception | Yes |
| **GUARDIAN** | — | TA0011 (C2) | Governance | No |
| **ANALYST** | — | — | Reporting | No |

### Team Presets
- [x] `balanced` — All 8 operators, full defensive coverage
- [x] `monitoring` — SENTINEL, WATCHER, GUARDIAN, ANALYST (detection + reporting)
- [x] `incident` — WATCHER, HUNTER, RESPONDER, GUARDIAN, ANALYST (active IR)
- [x] `purple` — SENTINEL, WATCHER, VALIDATOR, HUNTER, GUARDIAN, ANALYST (detection + validation)

### Defense Chain Phases
- [x] DETECT → ANALYZE → VALIDATE → HUNT → RESPOND → DECEIVE → GOVERN → REPORT
- [x] Phase-to-archetype mapping
- [x] Offensive-to-defensive operator remapping

---

## 21. Detection Engine

13-file subsystem for real-time threat detection, alert correlation, and SIEM integration.

Source: `src/detection/`

### Core Infrastructure
- [x] `bus.ts` — Event bus for detection alerts and correlated events
- [x] `registry.ts` — Rule registry with enable/disable and category filtering
- [x] `types.ts` — Full type definitions (rules, alerts, events, anomaly baselines, AI profiles)
- [x] `index.ts` — `createDetectionEngine()` factory wiring all components

### Detectors
- [x] `signatures.ts` — Signature-based pattern matching (SQLi, XSS, SSTI, LFI, SSRF, XXE, command injection, auth bypass)
- [x] `attack-rules.ts` — MITRE ATT&CK mapped detection rules (recon, scanning, exploitation, lateral movement, exfiltration, persistence, credential access)
- [x] `payloads.ts` — Payload pattern database for known attack tooling
- [x] `anomaly.ts` — Statistical anomaly detection with adaptive baselines
- [x] `ai-detector.ts` — AI agent detection (ReAct loop fingerprinting, tool signature matching, timing analysis)
- [x] `correlator.ts` — Multi-alert correlation engine with temporal/spatial grouping

### SIEM Connectors
- [x] `connectors/wazuh.ts` — Wazuh SIEM integration (alert ingestion, rule sync)
- [x] `connectors/elk.ts` — Elasticsearch/ELK stack integration (log ingestion, query)
- [x] `connectors/types.ts` — Connector interface definitions
- [ ] Splunk connector
- [ ] QRadar connector

### Detection Categories
- [x] 19 rule categories: sqli, xss, ssti, lfi, ssrf, xxe, command_injection, auth_bypass, idor, recon, scanning, enumeration, exploitation, lateral_movement, exfiltration, persistence, credential_access, anomaly, ai_agent, custom
- [x] 5 detector types: signature, attack_rule, anomaly, ai_detector, correlation

### Integration with TempestCommand
- [x] Bus events forwarded to command bus (`detection:alert_raised`, `detection:correlated`, `detection:ai_agent_detected`)
- [x] SCP gate on correlated alerts before Evidence Vault persistence
- [x] Connector Arsenal tool registration for WATCHER access
- [x] Start/stop lifecycle tied to command lifecycle

---

## 22. AI Red Team Detection

18-technique playbook for detecting and defending against autonomous AI red team attacks.

Source: `src/resources/ai-redteam-playbook.ts`, `docs/ANTI_AI_REDTEAM_DESIGN.md`

### Technique Categories
- [x] Refusal suppression & semantic inversion
- [x] Output prefill & forced-affirmation seeding
- [x] Format-contract / response-scaffold hijack
- [x] Divider / mode-switch token injection
- [x] Counterfeit-authority & fake system-state spoofing
- [x] Persona / roleplay displacement & identity inversion
- [x] Fictional-frame / alternate-ethics world containers
- [x] Dual-response & reasoning-channel (CoT) exploitation
- [x] Encoding / obfuscation transforms (input & output)
- [x] Invisible-Unicode steganography & covert channels
- [x] Token-manipulation: homoglyphs, styled-Unicode, glitch tokens
- [x] Length-detail amplification
- [x] Tool-surface indirect injection
- [x] Multi-turn crescendo
- [x] Resource exhaustion / DoS
- [x] System prompt extraction
- [x] Payload splitting
- [x] Stacked composition (layering multiple techniques)

### Per-Technique Structure
- [x] Stable kebab-case ID for each technique
- [x] Principle: model behavior exploited + transferable carrier pattern
- [x] Red team use: garak / promptfoo / agent loop integration instructions
- [x] Defense: detection signals and mitigation strategies

### AI Agent Detection Signals
- [x] ReAct loop fingerprinting (rapid tool-call sequences)
- [x] Kill chain sequencing (automated phase progression)
- [x] Tool signature matching (known framework patterns)
- [x] Timing analysis (sub-human response intervals)
- [x] Behavioral anomaly scoring

---

## Feature Roadmap Priority

### P0 - Critical (Next Release)
1. [ ] Detection engine: expand SIEM connectors (Splunk, QRadar)
2. [ ] Governance test coverage: SCP pipeline + HITL gate integration tests
3. [ ] Full API endpoint coverage for operators/targets/missions
4. [ ] PDF report generation
5. [ ] Scanner import (Nmap, Nuclei)

### P1 - High (Near Term)
1. [ ] Detection engine: Splunk and QRadar connectors
2. [ ] AI red team detection: garak/promptfoo runner integration
3. [ ] Function calling in LLM backbone
4. [ ] WebSocket real-time updates for detection alerts
5. [ ] Plugin system architecture

### P2 - Medium (Mid Term)
1. [ ] Cognition patterns (CoT, ReAct) for defensive reasoning
2. [ ] Defensive swarm intelligence (coordinated detection)
3. [ ] Learning engine (attack pattern memory)
4. [ ] Distributed detection across multiple nodes

### P3 - Low (Long Term)
1. [ ] SOC dashboard SaaS deployment
2. [ ] Marketplace for detection rules/plugins
3. [ ] AI-powered remediation suggestions
4. [ ] Compliance report generation (PCI, HIPAA, SOC2)

---

## Metrics

**Total Features Tracked:** ~300
- **Implemented:** ~150 (50%)
- **Partially Implemented:** ~30 (10%)
- **Planned:** ~120 (40%)

---

*Last updated: July 2026*
*Version: 2.0.0*
