/**
 * T3MP3ST BLU3H4T — Detection Registry
 *
 * Manages detection rule sets with category queries, enable/disable,
 * and hot-reload support. All detectors register their rules here;
 * the bus queries the registry when matching events.
 */

import { EventEmitter } from 'eventemitter3';
import type { DetectionRule, DetectionRuleCategory } from './types.js';

// =============================================================================
// EVENTS
// =============================================================================

export interface RegistryEvents {
  'rule:added': DetectionRule;
  'rule:removed': { ruleId: string };
  'rule:toggled': { ruleId: string; enabled: boolean };
  'registry:reloaded': { ruleCount: number };
}

// =============================================================================
// DETECTION REGISTRY
// =============================================================================

export class DetectionRegistry extends EventEmitter<RegistryEvents> {
  private rules: Map<string, DetectionRule> = new Map();
  private categoryIndex: Map<DetectionRuleCategory, Set<string>> = new Map();

  addRule(rule: DetectionRule): void {
    this.rules.set(rule.id, rule);
    this.indexRule(rule);
    this.emit('rule:added', rule);
  }

  addRules(rules: DetectionRule[]): void {
    for (const rule of rules) {
      this.rules.set(rule.id, rule);
      this.indexRule(rule);
    }
  }

  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.delete(ruleId);
    this.categoryIndex.get(rule.category)?.delete(ruleId);
    this.emit('rule:removed', { ruleId });
    return true;
  }

  getRule(ruleId: string): DetectionRule | undefined {
    return this.rules.get(ruleId);
  }

  getRulesByCategory(category: DetectionRuleCategory): DetectionRule[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.rules.get(id))
      .filter((r): r is DetectionRule => r !== undefined && r.enabled);
  }

  getEnabledRules(): DetectionRule[] {
    return Array.from(this.rules.values()).filter((r) => r.enabled);
  }

  getAllRules(): DetectionRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = true;
    this.emit('rule:toggled', { ruleId, enabled: true });
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = false;
    this.emit('rule:toggled', { ruleId, enabled: false });
    return true;
  }

  enableCategory(category: DetectionRuleCategory): void {
    const ids = this.categoryIndex.get(category);
    if (!ids) return;
    for (const id of ids) {
      const rule = this.rules.get(id);
      if (rule) rule.enabled = true;
    }
  }

  disableCategory(category: DetectionRuleCategory): void {
    const ids = this.categoryIndex.get(category);
    if (!ids) return;
    for (const id of ids) {
      const rule = this.rules.get(id);
      if (rule) rule.enabled = false;
    }
  }

  /**
   * Replace all rules atomically (hot-reload).
   * Preserves enable/disable state for rules with matching IDs.
   */
  hotReload(newRules: DetectionRule[]): void {
    const previousStates = new Map<string, boolean>();
    for (const [id, rule] of this.rules) {
      previousStates.set(id, rule.enabled);
    }

    this.rules.clear();
    this.categoryIndex.clear();

    for (const rule of newRules) {
      const prev = previousStates.get(rule.id);
      if (prev !== undefined) {
        rule.enabled = prev;
      }
      this.rules.set(rule.id, rule);
      this.indexRule(rule);
    }

    this.emit('registry:reloaded', { ruleCount: this.rules.size });
  }

  getRuleCount(): number {
    return this.rules.size;
  }

  getEnabledCount(): number {
    return Array.from(this.rules.values()).filter((r) => r.enabled).length;
  }

  getCategories(): DetectionRuleCategory[] {
    return Array.from(this.categoryIndex.keys());
  }

  getStats(): Record<string, { total: number; enabled: number }> {
    const stats: Record<string, { total: number; enabled: number }> = {};
    for (const [category, ids] of this.categoryIndex) {
      let enabled = 0;
      for (const id of ids) {
        if (this.rules.get(id)?.enabled) enabled++;
      }
      stats[category] = { total: ids.size, enabled };
    }
    return stats;
  }

  private indexRule(rule: DetectionRule): void {
    let categorySet = this.categoryIndex.get(rule.category);
    if (!categorySet) {
      categorySet = new Set();
      this.categoryIndex.set(rule.category, categorySet);
    }
    categorySet.add(rule.id);
  }
}

export function createDetectionRegistry(): DetectionRegistry {
  return new DetectionRegistry();
}
