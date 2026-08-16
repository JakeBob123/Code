'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import type { AutomodConfig, AutomodRule } from '@/lib/types';

const FILTER_ITEMS: { key: keyof AutomodConfig; label: string; help: string }[] = [
  { key: 'spamDetectionEnabled', label: 'Spam detection', help: 'General spam pattern detection.' },
  { key: 'floodDetectionEnabled', label: 'Message flooding', help: 'Too many messages in a short window.' },
  { key: 'mentionSpamEnabled', label: 'Mention spam', help: 'Excessive user or role mentions in one message.' },
  { key: 'linkFilterEnabled', label: 'Link filter', help: 'Blocks messages containing links.' },
  { key: 'inviteFilterEnabled', label: 'Discord invite filter', help: 'Blocks unauthorized server invites.' },
  { key: 'wordFilterEnabled', label: 'Word filter', help: 'Blocks messages matching custom word rules below.' },
  { key: 'capsFilterEnabled', label: 'Excessive caps', help: 'Blocks messages that are mostly uppercase.' },
  { key: 'emojiSpamEnabled', label: 'Emoji spam', help: 'Blocks messages with excessive emoji.' },
  { key: 'duplicateMessageEnabled', label: 'Duplicate messages', help: 'Blocks repeated identical messages.' },
];

export default function AutomodPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [config, setConfig] = useState<AutomodConfig | null>(null);
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ type: 'WORD_FILTER' as AutomodRule['type'], pattern: '', action: 'DELETE' as AutomodRule['action'] });
  const [addingRule, setAddingRule] = useState(false);

  useEffect(() => {
    api
      .getAutomod(guildId)
      .then((res) => {
        setConfig(res.config);
        setRules(res.rules);
      })
      .catch((err: ApiError) => setError(err.message));
  }, [guildId]);

  async function handleToggle(key: keyof AutomodConfig, value: boolean) {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, [key]: value });
    try {
      const res = await api.updateAutomodConfig(guildId, { [key]: value });
      setConfig(res.config);
    } catch (err) {
      setConfig(prev);
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    }
  }

  async function addRule() {
    if (!newRule.pattern.trim()) return;
    setAddingRule(true);
    try {
      const res = await api.createAutomodRule(guildId, newRule);
      setRules((r) => [...r, res.rule]);
      setNewRule({ ...newRule, pattern: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add rule');
    } finally {
      setAddingRule(false);
    }
  }

  async function removeRule(id: string) {
    const prev = rules;
    setRules((r) => r.filter((rule) => rule.id !== id));
    try {
      await api.deleteAutomodRule(guildId, id);
    } catch (err) {
      setRules(prev);
      setError(err instanceof ApiError ? err.message : 'Failed to delete rule');
    }
  }

  return (
    <div>
      <TopBar title="AutoMod" />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}

        {!config ? (
          <Panel>
            <p className="text-sm text-ink-faint">Loading AutoMod configuration…</p>
          </Panel>
        ) : (
          <Panel>
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Message filters</h2>
            <div className="divide-y divide-line">
              {FILTER_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-ink-muted">{item.help}</p>
                  </div>
                  <Toggle checked={Boolean(config[item.key])} onChange={(v) => handleToggle(item.key, v)} label={item.label} />
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-6 border-t border-line pt-4">
              <SliderField
                label={`Mention spam limit — ${config.mentionSpamLimit}`}
                value={config.mentionSpamLimit}
                min={2}
                max={20}
                onCommit={(v) => handleToggle('mentionSpamLimit', v as unknown as boolean)}
              />
              <SliderField
                label={`Caps threshold — ${config.capsPercentThreshold}%`}
                value={config.capsPercentThreshold}
                min={30}
                max={100}
                onCommit={(v) => handleToggle('capsPercentThreshold', v as unknown as boolean)}
              />
            </div>
          </Panel>
        )}

        <Panel>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">Custom rules</h2>
          <p className="mb-4 text-sm text-ink-muted">Word and link rules matched against every message, on top of the filters above.</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={newRule.type}
              onChange={(e) => setNewRule({ ...newRule, type: e.target.value as AutomodRule['type'] })}
              className="rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink"
            >
              <option value="WORD_FILTER">Word filter</option>
              <option value="LINK_BLACKLIST">Link blacklist</option>
              <option value="LINK_WHITELIST">Link whitelist</option>
            </select>
            <input
              value={newRule.pattern}
              onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
              placeholder="Word or domain to match"
              className="flex-1 min-w-[180px] rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none"
            />
            <select
              value={newRule.action}
              onChange={(e) => setNewRule({ ...newRule, action: e.target.value as AutomodRule['action'] })}
              className="rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink"
            >
              <option value="DELETE">Delete</option>
              <option value="WARN">Warn</option>
              <option value="TIMEOUT">Timeout</option>
              <option value="KICK">Kick</option>
              <option value="BAN">Ban</option>
            </select>
            <Button onClick={addRule} disabled={addingRule || !newRule.pattern.trim()}>
              Add rule
            </Button>
          </div>

          <div className="divide-y divide-line">
            {rules.length === 0 && <p className="py-4 text-center text-sm text-ink-faint">No custom rules yet.</p>}
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Badge tone="info">{rule.type.replace(/_/g, ' ')}</Badge>
                  <span className="font-mono text-sm text-ink">{rule.pattern}</span>
                  <Badge tone="neutral">{rule.action}</Badge>
                </div>
                <button onClick={() => removeRule(rule.id)} className="text-xs text-coral hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onMouseUp={() => local !== value && onCommit(local)}
        onTouchEnd={() => local !== value && onCommit(local)}
        className="w-full accent-violet"
      />
    </div>
  );
}
