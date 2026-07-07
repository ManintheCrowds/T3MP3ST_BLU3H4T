/**
 * T3MP3ST BLU3H4T — ELK (Elasticsearch) SIEM Connector
 *
 * Connects to an Elasticsearch cluster via REST API, queries for
 * security-relevant logs, and normalizes them into NormalizedEvents.
 * Also registers as an Arsenal tool for WATCHER operator access.
 */

import { randomUUID } from 'crypto';
import type { NormalizedEvent, ConnectorConfig, CredentialProvider } from '../types.js';
import type { CustomTool, ToolContext, ToolResult } from '../../types/index.js';
import { SIEMConnector } from './types.js';

// =============================================================================
// ELK CONNECTOR
// =============================================================================

export class ELKConnector extends SIEMConnector {
  private lastPollTimestamp = 0;

  constructor(config: ConnectorConfig, credentialProvider?: CredentialProvider) {
    super({
      ...config,
      type: 'elk',
      pollIntervalMs: config.pollIntervalMs || 30_000,
    }, credentialProvider);
  }

  async connect(): Promise<void> {
    try {
      const creds = await this.resolveCredentials();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (creds.username && creds.password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
      } else if (creds.apiKey) {
        headers['Authorization'] = `ApiKey ${creds.apiKey}`;
      }

      const response = await fetch(`${this.config.endpoint}/_cluster/health`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`ELK connection failed: ${response.status} ${response.statusText}`);
      }

      this.connected = true;
      this.lastPollTimestamp = Date.now() - 60_000;
      this.emit('connector:connected', { name: this.config.name });
    } catch (err) {
      this.connected = false;
      this.emit('connector:error', {
        name: this.config.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.connected = false;
    this.emit('connector:disconnected', { name: this.config.name });
  }

  async poll(): Promise<NormalizedEvent[]> {
    if (!this.connected) return [];

    const indexPattern = (this.config.options?.indexPattern as string) ?? 'filebeat-*,winlogbeat-*,packetbeat-*';

    try {
      const creds = await this.resolveCredentials();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (creds.username && creds.password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
      } else if (creds.apiKey) {
        headers['Authorization'] = `ApiKey ${creds.apiKey}`;
      }

      const query = {
        size: 100,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: {
          bool: {
            must: [
              { range: { '@timestamp': { gt: new Date(this.lastPollTimestamp).toISOString() } } },
            ],
            should: [
              { exists: { field: 'event.severity' } },
              { exists: { field: 'rule.name' } },
              { range: { 'event.severity': { gte: 2 } } },
            ],
            minimum_should_match: 1,
          },
        },
      };

      const response = await fetch(`${this.config.endpoint}/${indexPattern}/_search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`ELK query failed: ${response.status}`);
      }

      const body = await response.json() as {
        hits?: {
          hits?: Array<{
            _id: string;
            _source: Record<string, unknown>;
          }>;
        };
      };

      const hits = body.hits?.hits ?? [];
      const events: NormalizedEvent[] = [];

      for (const hit of hits) {
        const src = hit._source;
        const ts = src['@timestamp'] ? new Date(src['@timestamp'] as string).getTime() : Date.now();

        const sourceData = src['source'] as Record<string, unknown> | undefined;
        const destData = src['destination'] as Record<string, unknown> | undefined;
        const httpData = src['http'] as Record<string, unknown> | undefined;
        const urlData = src['url'] as Record<string, unknown> | undefined;
        const requestData = httpData?.['request'] as Record<string, unknown> | undefined;

        events.push({
          id: hit._id ?? randomUUID(),
          timestamp: ts,
          source: `elk:${this.config.name}`,
          sourceType: 'elk',
          sourceIP: sourceData?.['ip'] as string | undefined,
          targetIP: destData?.['ip'] as string | undefined,
          targetPort: destData?.['port'] as number | undefined,
          method: requestData?.['method'] as string | undefined,
          path: urlData?.['path'] as string | undefined,
          userAgent: (src['user_agent'] as Record<string, unknown>)?.['original'] as string | undefined,
          statusCode: (httpData?.['response'] as Record<string, unknown>)?.['status_code'] as number | undefined,
          data: {
            eventCategory: (src['event'] as Record<string, unknown>)?.['category'],
            eventSeverity: (src['event'] as Record<string, unknown>)?.['severity'],
            ruleName: (src['rule'] as Record<string, unknown>)?.['name'],
            ruleDescription: (src['rule'] as Record<string, unknown>)?.['description'],
          },
          raw: JSON.stringify(src).slice(0, 5000),
        });
      }

      if (events.length > 0) {
        this.lastPollTimestamp = Math.max(...events.map((e) => e.timestamp));
      }

      return events;
    } catch (err) {
      this.emit('connector:error', {
        name: this.config.name,
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /**
   * Create an Arsenal tool definition for WATCHER operator.
   */
  toArsenalTool = (): CustomTool => ({
    name: `elk_search_${this.config.name}`,
    description: `Search security logs from Elasticsearch "${this.config.name}"`,
    category: 'detection',
    parameters: [
      { name: 'query', type: 'string', description: 'Lucene query string', required: false, default: '*' },
      { name: 'limit', type: 'number', description: 'Max results', required: false, default: 50 },
      { name: 'index', type: 'string', description: 'Index pattern', required: false },
    ],
    handler: async (_context: ToolContext): Promise<ToolResult> => {
      try {
        const events = await this.poll();
        return {
          success: true,
          output: `Fetched ${events.length} events from ELK "${this.config.name}"`,
          findings: events
            .filter((e) => e.data?.eventSeverity && (e.data.eventSeverity as number) >= 3)
            .map((e) => ({
              title: `ELK Alert: ${(e.data?.ruleName as string) ?? 'Security event'}`,
              severity: mapELKSeverity((e.data?.eventSeverity as number) ?? 0),
              details: e.raw.slice(0, 500),
            })),
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  });
}

function mapELKSeverity(severity: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (severity >= 4) return 'critical';
  if (severity >= 3) return 'high';
  if (severity >= 2) return 'medium';
  if (severity >= 1) return 'low';
  return 'info';
}

export function createELKConnector(config: ConnectorConfig, credentialProvider?: CredentialProvider): ELKConnector {
  return new ELKConnector(config, credentialProvider);
}
