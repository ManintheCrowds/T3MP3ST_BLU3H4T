/**
 * T3MP3ST BLU3H4T — SIEM Connector Interfaces
 *
 * Contract for all SIEM/IDS connectors. Each connector normalizes
 * external security data into NormalizedEvents for the detection bus.
 */

import { EventEmitter } from 'eventemitter3';
import type { NormalizedEvent, ConnectorConfig, CredentialProvider } from '../types.js';

// =============================================================================
// CONNECTOR EVENTS
// =============================================================================

export interface SIEMConnectorEvents {
  'connector:connected': { name: string };
  'connector:disconnected': { name: string };
  'connector:error': { name: string; error: string };
  'connector:event_ingested': NormalizedEvent;
  'connector:poll_completed': { name: string; eventCount: number };
}

// =============================================================================
// CONNECTOR INTERFACE
// =============================================================================

export abstract class SIEMConnector extends EventEmitter<SIEMConnectorEvents> {
  protected config: ConnectorConfig;
  protected credentialProvider?: CredentialProvider;
  protected connected = false;
  protected pollTimer?: ReturnType<typeof setInterval>;

  constructor(config: ConnectorConfig, credentialProvider?: CredentialProvider) {
    super();
    this.config = config;
    this.credentialProvider = credentialProvider;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract poll(): Promise<NormalizedEvent[]>;

  async startPolling(onEvent: (event: NormalizedEvent) => void): Promise<void> {
    if (!this.connected) await this.connect();

    const doPoll = async () => {
      try {
        const events = await this.poll();
        for (const event of events) {
          onEvent(event);
          this.emit('connector:event_ingested', event);
        }
        this.emit('connector:poll_completed', { name: this.config.name, eventCount: events.length });
      } catch (err) {
        this.emit('connector:error', {
          name: this.config.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    await doPoll();

    if (this.config.pollIntervalMs > 0) {
      this.pollTimer = setInterval(doPoll, this.config.pollIntervalMs);
    }
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): ConnectorConfig {
    return { ...this.config };
  }

  protected async resolveCredentials(): Promise<{ username?: string; password?: string; token?: string; apiKey?: string }> {
    if (!this.credentialProvider || !this.config.credentialKey) {
      return {};
    }
    return this.credentialProvider.getCredential(this.config.credentialKey);
  }
}

// =============================================================================
// ENV-BASED CREDENTIAL PROVIDER (governance-stack default)
// =============================================================================

export class EnvCredentialProvider implements CredentialProvider {
  async getCredential(key: string): Promise<{ username?: string; password?: string; token?: string; apiKey?: string }> {
    const prefix = key.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return {
      username: process.env[`${prefix}_USERNAME`],
      password: process.env[`${prefix}_PASSWORD`],
      token: process.env[`${prefix}_TOKEN`],
      apiKey: process.env[`${prefix}_API_KEY`],
    };
  }
}
