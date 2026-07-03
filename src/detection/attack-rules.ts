/**
 * T3MP3ST BLU3H4T — ATT&CK Rule Engine
 *
 * Maps 40+ MITRE ATT&CK techniques to detection rules with
 * D3FEND countermeasure annotations. Rules detect technique
 * indicators in normalized events from SIEM connectors.
 */

import { EventEmitter } from 'eventemitter3';
import { randomUUID } from 'crypto';
import type {
  DetectionRule,
  DetectionAlert,
  NormalizedEvent,
  DetectionRuleCategory,
} from './types.js';
import type { Severity } from '../types/index.js';
import type { DetectionBus } from './bus.js';
import type { DetectionRegistry } from './registry.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface ATTACKRuleEngineEvents {
  'attack:detected': DetectionAlert;
  'attack:rules_loaded': { count: number };
}

// =============================================================================
// ATT&CK TECHNIQUE DEFINITION
// =============================================================================

interface ATTACKTechnique {
  id: string;
  name: string;
  tactic: string;
  pattern: RegExp;
  category: DetectionRuleCategory;
  severity: Severity;
  defendId: string;
  defendName: string;
  description: string;
}

// =============================================================================
// TECHNIQUE DATABASE (40+ techniques)
// =============================================================================

const ATTACK_TECHNIQUES: ATTACKTechnique[] = [
  // Reconnaissance
  { id: 'T1595', name: 'Active Scanning', tactic: 'reconnaissance', pattern: /(?:port\s*scan|nmap|masscan|zmap)/i, category: 'scanning', severity: 'medium', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Port scanning or network discovery activity' },
  { id: 'T1595.001', name: 'Scanning IP Blocks', tactic: 'reconnaissance', pattern: /(?:sequential|sweep)\s*(?:scan|probe)/i, category: 'scanning', severity: 'medium', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Systematic IP block scanning' },
  { id: 'T1595.002', name: 'Vulnerability Scanning', tactic: 'reconnaissance', pattern: /(?:nikto|openvas|nessus|qualys|nuclei)/i, category: 'scanning', severity: 'high', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Known vulnerability scanner detected' },
  { id: 'T1592', name: 'Gather Victim Host Info', tactic: 'reconnaissance', pattern: /(?:fingerprint|banner\s*grab|service\s*detect)/i, category: 'recon', severity: 'low', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Host information gathering' },
  { id: 'T1590', name: 'Gather Victim Network Info', tactic: 'reconnaissance', pattern: /(?:traceroute|whois|dig|nslookup|subdomain)/i, category: 'recon', severity: 'low', defendId: 'D3-DNRA', defendName: 'DNS Record Analysis', description: 'Network information gathering' },
  { id: 'T1589', name: 'Gather Victim Identity Info', tactic: 'reconnaissance', pattern: /(?:linkedin|theHarvester|hunter\.io|email\s*harvest)/i, category: 'recon', severity: 'low', defendId: 'D3-UDTA', defendName: 'User Data Transfer Analysis', description: 'Identity information gathering' },
  { id: 'T1593', name: 'Search Open Websites', tactic: 'reconnaissance', pattern: /(?:google\s*dork|site:|inurl:|filetype:)/i, category: 'recon', severity: 'info', defendId: 'D3-WSAA', defendName: 'Web Session Activity Analysis', description: 'Search engine reconnaissance' },
  { id: 'T1596', name: 'Search Open Technical DBs', tactic: 'reconnaissance', pattern: /(?:shodan|censys|zoomeye|binaryedge|onyphe)/i, category: 'recon', severity: 'medium', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Technical database reconnaissance' },

  // Resource Development
  { id: 'T1583', name: 'Acquire Infrastructure', tactic: 'resource-development', pattern: /(?:c2|command\s*and\s*control|staging\s*server)/i, category: 'recon', severity: 'high', defendId: 'D3-DNRA', defendName: 'DNS Record Analysis', description: 'C2 infrastructure indicators' },

  // Initial Access
  { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'initial-access', pattern: /(?:exploit|payload|injection|overflow|rce|remote\s*code)/i, category: 'exploitation', severity: 'critical', defendId: 'D3-WAF', defendName: 'Web Application Firewall', description: 'Application exploitation attempt' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'initial-access', pattern: /(?:brute\s*force|credential\s*stuff|password\s*spray)/i, category: 'credential_access', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Credential attack detected' },
  { id: 'T1133', name: 'External Remote Services', tactic: 'initial-access', pattern: /(?:vpn|rdp|ssh)\s*(?:brute|scan|probe)/i, category: 'credential_access', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Remote service attack' },
  { id: 'T1566', name: 'Phishing', tactic: 'initial-access', pattern: /(?:phish|spear|social\s*engineer)/i, category: 'recon', severity: 'high', defendId: 'D3-EFA', defendName: 'Email Filtering Analysis', description: 'Phishing indicators' },

  // Execution
  { id: 'T1059', name: 'Command and Scripting', tactic: 'execution', pattern: /(?:cmd\.exe|powershell|bash|sh -c|python -c)/i, category: 'command_injection', severity: 'critical', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'Suspicious command execution' },
  { id: 'T1059.001', name: 'PowerShell', tactic: 'execution', pattern: /(?:powershell|pwsh|invoke-expression|iex|downloadstring)/i, category: 'command_injection', severity: 'critical', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'PowerShell execution' },
  { id: 'T1059.003', name: 'Windows Command Shell', tactic: 'execution', pattern: /(?:cmd\.exe\s*\/c|cmd\.exe\s*\/k)/i, category: 'command_injection', severity: 'high', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'Windows command shell execution' },
  { id: 'T1059.004', name: 'Unix Shell', tactic: 'execution', pattern: /(?:\/bin\/(?:ba)?sh|\/bin\/zsh|bash -i)/i, category: 'command_injection', severity: 'high', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'Unix shell execution' },
  { id: 'T1059.007', name: 'JavaScript', tactic: 'execution', pattern: /(?:eval\(|Function\(|setTimeout\(.*,|setInterval\()/i, category: 'xss', severity: 'high', defendId: 'D3-JSA', defendName: 'JavaScript Analysis', description: 'JavaScript code execution' },
  { id: 'T1203', name: 'Exploitation for Client Exec', tactic: 'execution', pattern: /(?:buffer\s*overflow|use.after.free|heap\s*spray)/i, category: 'exploitation', severity: 'critical', defendId: 'D3-EEI', defendName: 'Executable Examination/Inspection', description: 'Memory corruption exploitation' },

  // Persistence
  { id: 'T1505.003', name: 'Web Shell', tactic: 'persistence', pattern: /(?:webshell|c99|r57|wso|php\s*shell|cmd\s*shell)/i, category: 'persistence', severity: 'critical', defendId: 'D3-FH', defendName: 'File Hashing', description: 'Web shell deployment' },
  { id: 'T1136', name: 'Create Account', tactic: 'persistence', pattern: /(?:adduser|useradd|net\s*user\s*\/add)/i, category: 'persistence', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Account creation' },
  { id: 'T1098', name: 'Account Manipulation', tactic: 'persistence', pattern: /(?:passwd|chpasswd|net\s*user.*\/active)/i, category: 'persistence', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Account manipulation' },

  // Privilege Escalation
  { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'privilege-escalation', pattern: /(?:privesc|privilege\s*escalat|sudo\s*exploit|suid)/i, category: 'exploitation', severity: 'critical', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'Privilege escalation attempt' },

  // Defense Evasion
  { id: 'T1070', name: 'Indicator Removal', tactic: 'defense-evasion', pattern: /(?:clear.*(?:log|history|event)|shred|wipe|rm -rf.*log)/i, category: 'lateral_movement', severity: 'high', defendId: 'D3-CLM', defendName: 'Central Log Management', description: 'Log or indicator removal' },
  { id: 'T1027', name: 'Obfuscated Files', tactic: 'defense-evasion', pattern: /(?:base64\s*(?:decode|encode)|certutil.*decode|gzip.*base64)/i, category: 'lateral_movement', severity: 'medium', defendId: 'D3-EEI', defendName: 'Executable Examination/Inspection', description: 'Obfuscation or encoding' },
  { id: 'T1140', name: 'Deobfuscate/Decode', tactic: 'defense-evasion', pattern: /(?:decode|decrypt|decompress|unpack|unzip).*(?:payload|script|shell)/i, category: 'lateral_movement', severity: 'medium', defendId: 'D3-EEI', defendName: 'Executable Examination/Inspection', description: 'Payload deobfuscation' },

  // Credential Access
  { id: 'T1110', name: 'Brute Force', tactic: 'credential-access', pattern: /(?:brute\s*force|password\s*spray|credential\s*stuff|hydra|medusa)/i, category: 'credential_access', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Brute force attack' },
  { id: 'T1110.001', name: 'Password Guessing', tactic: 'credential-access', pattern: /(?:failed\s*login|auth.*fail|invalid\s*password)/i, category: 'credential_access', severity: 'medium', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Password guessing activity' },
  { id: 'T1110.003', name: 'Password Spraying', tactic: 'credential-access', pattern: /(?:spray|multiple\s*users?\s*same\s*password)/i, category: 'credential_access', severity: 'high', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Password spraying attack' },
  { id: 'T1003', name: 'OS Credential Dumping', tactic: 'credential-access', pattern: /(?:mimikatz|hashdump|sam\s*dump|lsass|secretsdump)/i, category: 'credential_access', severity: 'critical', defendId: 'D3-CDA', defendName: 'Credential Data Analysis', description: 'Credential dumping tool' },
  { id: 'T1552', name: 'Unsecured Credentials', tactic: 'credential-access', pattern: /(?:\.env|credentials\.|password.*file|shadow\s*file)/i, category: 'credential_access', severity: 'high', defendId: 'D3-CDA', defendName: 'Credential Data Analysis', description: 'Unsecured credential access' },

  // Discovery
  { id: 'T1046', name: 'Network Service Scanning', tactic: 'discovery', pattern: /(?:port\s*(?:scan|probe)|service\s*enum|banner\s*grab)/i, category: 'scanning', severity: 'medium', defendId: 'D3-PM', defendName: 'Port Monitoring', description: 'Network service scanning' },
  { id: 'T1083', name: 'File and Directory Discovery', tactic: 'discovery', pattern: /(?:dir\s*brute|directory\s*enum|gobuster|dirb|dirsearch|feroxbuster|ffuf)/i, category: 'enumeration', severity: 'medium', defendId: 'D3-FA', defendName: 'File Analysis', description: 'Directory enumeration' },
  { id: 'T1087', name: 'Account Discovery', tactic: 'discovery', pattern: /(?:enum.*user|user.*enum|ldapsearch|net\s*user|enum4linux)/i, category: 'enumeration', severity: 'medium', defendId: 'D3-ANET', defendName: 'Authentication Event Thresholding', description: 'Account enumeration' },
  { id: 'T1082', name: 'System Information Discovery', tactic: 'discovery', pattern: /(?:uname -a|systeminfo|hostnamectl|lsb_release)/i, category: 'recon', severity: 'low', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'System information gathering' },
  { id: 'T1016', name: 'System Network Config', tactic: 'discovery', pattern: /(?:ifconfig|ipconfig|ip\s+addr|netstat|ss -)/i, category: 'recon', severity: 'low', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Network configuration discovery' },

  // Lateral Movement
  { id: 'T1021', name: 'Remote Services', tactic: 'lateral-movement', pattern: /(?:psexec|wmiexec|smbexec|evil-winrm|ssh\s+-)/i, category: 'lateral_movement', severity: 'high', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Remote service lateral movement' },
  { id: 'T1021.001', name: 'Remote Desktop Protocol', tactic: 'lateral-movement', pattern: /(?:rdp\s*(?:brute|connect|session)|3389)/i, category: 'lateral_movement', severity: 'high', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'RDP lateral movement' },

  // Collection
  { id: 'T1005', name: 'Data from Local System', tactic: 'collection', pattern: /(?:find.*-name|locate|grep -r.*(?:password|secret|key))/i, category: 'exfiltration', severity: 'medium', defendId: 'D3-FA', defendName: 'File Analysis', description: 'Local data collection' },

  // Exfiltration
  { id: 'T1041', name: 'Exfiltration Over C2', tactic: 'exfiltration', pattern: /(?:exfil|data\s*transfer|upload.*(?:dump|backup|db))/i, category: 'exfiltration', severity: 'critical', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Data exfiltration indicators' },
  { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'exfiltration', pattern: /(?:dns\s*tunnel|icmp\s*tunnel|dns.*exfil)/i, category: 'exfiltration', severity: 'critical', defendId: 'D3-DNRA', defendName: 'DNS Record Analysis', description: 'Covert channel exfiltration' },

  // Impact
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'impact', pattern: /(?:ransom|encrypt.*files|\.locked|\.encrypted)/i, category: 'exploitation', severity: 'critical', defendId: 'D3-FH', defendName: 'File Hashing', description: 'Ransomware indicators' },
  { id: 'T1489', name: 'Service Stop', tactic: 'impact', pattern: /(?:systemctl\s*stop|service\s*stop|net\s*stop|sc\s*stop)/i, category: 'exploitation', severity: 'high', defendId: 'D3-PSA', defendName: 'Process Spawn Analysis', description: 'Service disruption' },
  { id: 'T1499', name: 'Endpoint Denial of Service', tactic: 'impact', pattern: /(?:dos|ddos|slowloris|syn\s*flood)/i, category: 'exploitation', severity: 'high', defendId: 'D3-NTA', defendName: 'Network Traffic Analysis', description: 'Denial of service attack' },
];

// =============================================================================
// ATT&CK RULE ENGINE
// =============================================================================

export class ATTACKRuleEngine extends EventEmitter<ATTACKRuleEngineEvents> {
  private rules: DetectionRule[] = [];
  private bus?: DetectionBus;

  /**
   * Load all ATT&CK technique definitions as detection rules.
   */
  loadRules(): DetectionRule[] {
    this.rules = ATTACK_TECHNIQUES.map((tech) => ({
      id: `attack-${tech.id}`,
      name: `ATT&CK ${tech.id}: ${tech.name}`,
      pattern: tech.pattern,
      category: tech.category,
      severity: tech.severity,
      mitreId: tech.id,
      defendId: tech.defendId,
      description: tech.description,
      enabled: true,
      tags: ['attack', tech.tactic, tech.defendName],
    }));

    this.emit('attack:rules_loaded', { count: this.rules.length });
    return this.rules;
  }

  /**
   * Wire into the detection bus and registry.
   */
  attach(bus: DetectionBus, registry: DetectionRegistry): void {
    this.bus = bus;

    const rules = this.loadRules();
    registry.addRules(rules);

    bus.on('event:ingested', (event) => this.matchEvent(event));
  }

  /**
   * Match a normalized event against ATT&CK rules.
   */
  matchEvent(event: NormalizedEvent): DetectionAlert[] {
    const alerts: DetectionAlert[] = [];
    const content = [
      event.raw,
      event.path ?? '',
      event.body ?? '',
      event.userAgent ?? '',
      JSON.stringify(event.data),
    ].join('\n');

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern, 'i');
      const match = pattern.exec(content);

      if (match) {
        const alert: DetectionAlert = {
          id: randomUUID(),
          ruleId: rule.id,
          ruleName: rule.name,
          event,
          severity: rule.severity,
          confidence: 0.75,
          detectorType: 'attack_rule',
          category: rule.category,
          mitreId: rule.mitreId,
          defendId: rule.defendId,
          description: rule.description,
          timestamp: Date.now(),
          matchedContent: match[0].slice(0, 200),
        };

        alerts.push(alert);
        this.emit('attack:detected', alert);
        this.bus?.raiseAlert(alert);
      }
    }

    return alerts;
  }

  getRuleCount(): number {
    return this.rules.length;
  }

  getTechniqueById(mitreId: string): DetectionRule | undefined {
    return this.rules.find((r) => r.mitreId === mitreId);
  }

  getRulesByTactic(tactic: string): DetectionRule[] {
    return this.rules.filter((r) => r.tags?.includes(tactic));
  }
}

export function createATTACKRuleEngine(): ATTACKRuleEngine {
  return new ATTACKRuleEngine();
}
