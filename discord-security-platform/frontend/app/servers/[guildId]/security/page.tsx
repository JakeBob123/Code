'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import type { SecurityConfig } from '@/lib/types';

const TOGGLE_GROUPS: { title: string; items: { key: keyof SecurityConfig; label: string; help: string }[] }[] = [
  {
    title: 'Anti-Nuke',
    items: [
      { key: 'antiNukeEnabled', label: 'Anti-Nuke', help: 'Master switch for all destructive-action protections below.' },
      { key: 'antiMassBanEnabled', label: 'Mass ban protection', help: 'Flags a moderator banning members faster than normal.' },
      { key: 'antiMassKickEnabled', label: 'Mass kick protection', help: 'Flags a moderator kicking members faster than normal.' },
      { key: 'antiChannelDeleteEnabled', label: 'Channel deletion', help: 'Flags rapid channel deletion.' },
      { key: 'antiChannelCreateEnabled', label: 'Channel creation', help: 'Flags rapid channel creation (spam channels).' },
      { key: 'antiRoleDeleteEnabled', label: 'Role deletion', help: 'Flags rapid role deletion.' },
      { key: 'antiRoleCreateEnabled', label: 'Role creation', help: 'Flags rapid role creation.' },
      { key: 'antiPermissionAbuseEnabled', label: 'Permission abuse', help: 'Flags suspicious permission grants.' },
      { key: 'antiWebhookAbuseEnabled', label: 'Webhook abuse', help: 'Flags webhook creation used for spam or impersonation.' },
      { key: 'antiBotAbuseEnabled', label: 'Bot abuse', help: 'Flags unauthorized bot additions.' },
    ],
  },
  {
    title: 'Anti-Raid & Join Protection',
    items: [
      { key: 'antiRaidEnabled', label: 'Anti-Raid', help: 'Detects and responds to coordinated join floods.' },
      { key: 'joinProtectionEnabled', label: 'Join protection', help: 'Screens new joins against the account-age threshold.' },
    ],
  },
];

export default function SecurityPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lockdownBusy, setLockdownBusy] = useState(false);

  useEffect(() => {
    api
      .getSecurityConfig(guildId)
      .then((res) => setConfig(res.config))
      .catch((err: ApiError) => setError(err.message));
  }, [guildId]);

  async function handleToggle(key: keyof SecurityConfig, value: boolean) {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, [key]: value });
    setSaving(key);
    try {
      const res = await api.updateSecurityConfig(guildId, { [key]: value });
      setConfig(res.config);
    } catch (err) {
      setConfig(prev); // revert on failure
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(null);
    }
  }

  async function handleNumberChange(key: keyof SecurityConfig, value: number) {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, [key]: value });
    try {
      const res = await api.updateSecurityConfig(guildId, { [key]: value });
      setConfig(res.config);
    } catch (err) {
      setConfig(prev);
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    }
  }

  async function toggleLockdown() {
    if (!config) return;
    setLockdownBusy(true);
    try {
      if (config.lockdownActive) {
        await api.disableLockdown(guildId);
      } else {
        await api.enableLockdown(guildId);
      }
      const res = await api.getSecurityConfig(guildId);
      setConfig(res.config);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change lockdown state');
    } finally {
      setLockdownBusy(false);
    }
  }

  return (
    <div>
      <TopBar title="Security" />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}

        <Panel className={config?.lockdownActive ? 'border-coral/40 bg-coral/5' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-ink">Emergency lockdown</h2>
                {config?.lockdownActive && <Badge tone="danger">Active</Badge>}
              </div>
              <p className="text-sm text-ink-muted">Immediately blocks @everyone from sending messages in every channel.</p>
            </div>
            <Button
              variant={config?.lockdownActive ? 'secondary' : 'danger'}
              disabled={!config || lockdownBusy}
              onClick={toggleLockdown}
            >
              {lockdownBusy ? 'Working…' : config?.lockdownActive ? 'Lift lockdown' : 'Enable lockdown'}
            </Button>
          </div>
        </Panel>

        {!config ? (
          <Panel>
            <p className="text-sm text-ink-faint">Loading security configuration…</p>
          </Panel>
        ) : (
          <>
            {TOGGLE_GROUPS.map((group) => (
              <Panel key={group.title}>
                <h2 className="mb-4 font-display text-base font-semibold text-ink">{group.title}</h2>
                <div className="divide-y divide-line">
                  {group.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{item.label}</p>
                        <p className="text-xs text-ink-muted">{item.help}</p>
                      </div>
                      <Toggle
                        checked={Boolean(config[item.key])}
                        onChange={(v) => handleToggle(item.key, v)}
                        disabled={saving === item.key}
                        label={item.label}
                      />
                    </div>
                  ))}
                </div>
              </Panel>
            ))}

            <Panel>
              <h2 className="mb-4 font-display text-base font-semibold text-ink">Thresholds</h2>
              <div className="grid grid-cols-2 gap-6">
                <NumberField
                  label="Mass-action threshold"
                  help="Actions within the window that trigger anti-nuke"
                  value={config.massActionThreshold}
                  onCommit={(v) => handleNumberChange('massActionThreshold', v)}
                />
                <NumberField
                  label="Mass-action window (seconds)"
                  help="Time window for the threshold above"
                  value={config.massActionWindowSeconds}
                  onCommit={(v) => handleNumberChange('massActionWindowSeconds', v)}
                />
                <NumberField
                  label="Raid join threshold"
                  help="Joins within the window that trigger anti-raid"
                  value={config.raidJoinThreshold}
                  onCommit={(v) => handleNumberChange('raidJoinThreshold', v)}
                />
                <NumberField
                  label="Raid join window (seconds)"
                  help="Time window for the threshold above"
                  value={config.raidJoinWindowSeconds}
                  onCommit={(v) => handleNumberChange('raidJoinWindowSeconds', v)}
                />
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  help,
  value,
  onCommit,
}: {
  label: string;
  help: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <p className="mb-2 text-xs text-ink-muted">{help}</p>
      <input
        type="number"
        min={1}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onBlur={() => local !== value && onCommit(local)}
        className="w-full rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
      />
    </div>
  );
}
