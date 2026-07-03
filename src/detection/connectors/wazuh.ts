/**
 * T3MP3ST BLU3H4T — Wazuh SIEM Connector
 *
 * Connects to a Wazuh manager via REST API, polls for alerts,
 * and normalizes them into NormalizedEvents for the detection bus.
 * Also registers as an Arsenal tool for WATCHER operator access.
 */

import { randomUUID } from 'crypto';
import type { NormalizedEvent, ConnectorConfig, CredentialProvider } from '../types.js';
import type { CustomTool, ToolContext, ToolResult } from '../../types/index.js';
import { SIEMConnector } from './types.js';

// =============================================================================
// WAZUH CONNECTOR
// =============================================================================

export class WazuhConnector extends SIEMConnector {
  private authToken?: string;
  private lastPollTimestamp = 0;

  constructor(config: ConnectorConfig, credentialProvider?: CredentialProvider) {
    super({
      ...config,
      type: 'wazuh',
      pollIntervalMs: config.pollIntervalMs || 30_000,
    }, credentialProvider);
  }

  async connect(): Promise<void> {
    try {
      const creds = await this.resolveCredentials();
      const authHeader = creds.username && creds.password
        ? `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`
        : creds.token ? `Bearer ${creds.token}` : undefined;

      if (!authHeader) {
        this.emit('connector:error', { name: this.config.name, error: 'No credentials available for Wazuh' });
        return;
      }

      const response = await fetch(`${this.config.endpoint}/security/user/authenticate`, {
        method: 'POST',
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Wazuh auth failed: ${response.status} ${response.statusText}`);
      }

      const body = await response.json() as { data?: { token?: string } };
      this.authToken = body.data?.token;
      this.connected = true;
      this.lastPollTimestamp = Date.now();
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
    this.authToken = undefined;
    this.connected = false;
    this.emit('connector:disconnected', { name: this.config.name });
  }

  async poll(): Promise<NormalizedEvent[]> {
    if (!this.connected || !this.authToken) return [];

    try {
      const response = await fetch(
        `${this.config.endpoint}/alerts?pretty=true&sort=-timestamp&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          this.connected = false;
          await this.connect();
          return [];
        }
        throw new Error(`Wazuh poll failed: ${response.status}`);
      }

      const body = await response.json() as {
        data?: {
          affected_items?: Array<{
            id?: string;
            timestamp?: string;
            rule?: { level?: number; description?: string; groups?: string[] };
            agent?: { id?: string; ip?: string; name?: string };
            data?: Record<string, unknown>;
            full_log?: string;
          }>;
        };
      };

      const alerts = body.data?.affected_items ?? [];
      const events: NormalizedEvent[] = [];

      for (const alert of alerts) {
        const ts = alert.timestamp ? new Date(alert.timestamp).getTime() : Date.now();
        if (ts <= this.lastPollTimestamp) continue;

        events.push({
          id: alert.id ?? randomUUID(),
          timestamp: ts,
          source: `wazuh:${this.config.name}`,
          sourceType: 'wazuh',
          sourceIP: alert.agent?.ip,
          data: {
            ruleLevel: alert.rule?.level,
            ruleDescription: alert.rule?.description,
            groups: alert.rule?.groups,
            agentName: alert.agent?.name,
            ...alert.data,
          },
          raw: alert.full_log ?? JSON.stringify(alert),
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
  toArsenalTool(): CustomTool {
    const connector = this;
    return {
      name: `wazuh_alerts_${this.config.name}`,
      description: `Fetch recent alerts from Wazuh instance "${this.config.name}"`,
      category: 'detection',
      parameters: [
        { name: 'limit', type: 'number', description: 'Max alerts to fetch', required: false, default: 50 },
        { name: 'level_min', type: 'number', description: 'Minimum rule level', required: false, default: 3 },
      ],
      async handler(context: ToolContext): Promise<ToolResult> {
        try {
          const events = await connector.poll();
          return {
            success: true,
            output: `Fetched ${events.length} alerts from Wazuh "${connector.config.name}"`,
            findings: events.map((e) => ({
              title: `Wazuh Alert: ${(e.data?.ruleDescription as string) ?? 'Unknown'}`,
              severity: mapWazuhLevel((e.data?.ruleLevel as number) ?? 0),
              details: e.raw.slice(0, 500),
            })),
          };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    };
  }
}

function mapWazuhLevel(level: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (level >= 12) return 'critical';
  if (level >= 8) return 'high';
  if (level >= 5) return 'medium';
  if (level >= 3) return 'low';
  return 'info';
}

export function createWazuhConnector(config: ConnectorConfig, credentialProvider?: CredentialProvider): WazuhConnector {
  return new WazuhConnector(config, credentialProvider);
}
