'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import type { SecurityConfig } from '@/lib/types';

const PUNISHMENTS: SecurityConfig['punishmentAction'][] = ['QUARANTINE', 'KICK', 'BAN', 'STRIP_ROLES'];

export default function ConfigPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSecurityConfig(guildId)
      .then((res) => setConfig(res.config))
      .catch((err: ApiError) => setError(err.message));
  }, [guildId]);

  async function setPunishment(action: SecurityConfig['punishmentAction']) {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, punishmentAction: action });
    try {
      const res = await api.updateSecurityConfig(guildId, { punishmentAction: action });
      setConfig(res.config);
    } catch (err) {
      setConfig(prev);
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    }
  }

  async function setAccountAge(minutes: number) {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, minAccountAgeMinutes: minutes });
    try {
      const res = await api.updateSecurityConfig(guildId, { minAccountAgeMinutes: minutes });
      setConfig(res.config);
    } catch (err) {
      setConfig(prev);
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    }
  }

  return (
    <div>
      <TopBar title="Configuration" />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}

        <Panel>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">Punishment action</h2>
          <p className="mb-4 text-sm text-ink-muted">What Aegis does to whoever triggers anti-nuke or anti-raid.</p>
          <div className="flex flex-wrap gap-2">
            {PUNISHMENTS.map((p) => (
              <button
                key={p}
                onClick={() => setPunishment(p)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  config?.punishmentAction === p
                    ? 'border-violet bg-violet/15 text-violet-bright shadow-glow'
                    : 'border-line bg-base-800 text-ink-muted hover:text-ink'
                }`}
              >
                {p.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">Minimum account age</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Accounts younger than this, joining during a detected raid, are treated as suspicious. Set to 0 to disable.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={config?.minAccountAgeMinutes ?? 0}
              onChange={(e) => setAccountAge(Number(e.target.value))}
              className="w-32 rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none"
            />
            <span className="text-sm text-ink-muted">minutes</span>
          </div>
        </Panel>

        <Panel>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Whitelists &amp; blacklists</h2>
            <Badge tone="info">Manage in AutoMod</Badge>
          </div>
          <p className="text-sm text-ink-muted">
            Word and link rules live on the AutoMod page, where they're matched against messages in real time.
          </p>
        </Panel>

        <Panel className="opacity-70">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Notification settings</h2>
            <Badge tone="neutral">Not yet available</Badge>
          </div>
          <p className="text-sm text-ink-muted">
            Per-event notification routing (DM vs. channel, per-category mute) isn't wired to the backend yet —
            it's the next natural extension of the config schema in <code className="font-mono text-xs">SecurityConfig</code>.
          </p>
        </Panel>
      </div>
    </div>
  );
}
