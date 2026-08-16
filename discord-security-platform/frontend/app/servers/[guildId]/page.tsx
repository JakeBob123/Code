'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThreatRing } from '@/components/overview/ThreatRing';
import { useGuildRealtime } from '@/lib/useGuildRealtime';
import { api, ApiError } from '@/lib/api';
import type { GuildOverview, SecurityConfig } from '@/lib/types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OverviewPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [overview, setOverview] = useState<GuildOverview | null>(null);
  const [security, setSecurity] = useState<SecurityConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  type RaidBanner = { accountsDetected: number; accountsBlocked: number; accountsKicked: number; detectionTime: string };
  const [raidBanner, setRaidBanner] = useState<RaidBanner | null>(null);

  const { connected: realtimeConnected, events } = useGuildRealtime(guildId);

  useEffect(() => {
    Promise.all([api.overview(guildId), api.getSecurityConfig(guildId)])
      .then(([ov, sec]) => {
        setOverview(ov);
        setSecurity(sec.config);
      })
      .catch((err: ApiError) => setError(err.message));
  }, [guildId]);

  // React to live raid detections and refresh overview counters when
  // moderation actions or security events come through.
  useEffect(() => {
    const latest = events[0];
    if (!latest) return;
    if (latest.event === 'security.raid_detected') {
      setRaidBanner(latest.payload as RaidBanner);
    }
    if (
      latest.event === 'moderation.action' ||
      latest.event === 'security.nuke_attempt_blocked' ||
      latest.event === 'security.lockdown_enabled' ||
      latest.event === 'security.lockdown_disabled'
    ) {
      api.overview(guildId).then(setOverview).catch(() => {});
    }
  }, [events, guildId]);

  if (error) {
    return (
      <div>
        <TopBar title="Overview" />
        <div className="p-8">
          <Panel className="border-coral/30 text-coral">Couldn't load this server: {error}</Panel>
        </div>
      </div>
    );
  }

  const enabledCount = security
    ? Object.entries(security).filter(([k, v]) => k.startsWith('anti') && v === true).length
    : 0;
  const totalToggleable = security ? Object.keys(security).filter((k) => k.startsWith('anti')).length : 12;
  const score = security ? Math.round((enabledCount / Math.max(totalToggleable, 1)) * 100) : 0;

  return (
    <div>
      <TopBar title="Overview" botConnected={overview?.botConnected} />

      <div className="space-y-6 p-8">
        {raidBanner && (
          <Panel className="border-coral/40 bg-coral/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-coral">
                  🚨 Raid detected
                </p>
                <p className="text-sm text-ink-muted">Detected {timeAgo(raidBanner.detectionTime)}</p>
              </div>
              <button onClick={() => setRaidBanner(null)} className="text-ink-faint hover:text-ink-muted" aria-label="Dismiss">
                ✕
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Stat label="Accounts detected" value={raidBanner.accountsDetected} />
              <Stat label="Accounts blocked" value={raidBanner.accountsBlocked} tone="danger" />
              <Stat label="Accounts kicked" value={raidBanner.accountsKicked} tone="warning" />
            </div>
          </Panel>
        )}

        <div className="grid grid-cols-3 gap-6">
          <Panel className="col-span-1 flex flex-col items-center justify-center gap-4 text-center">
            <ThreatRing score={score} alert={!!raidBanner} />
            <div>
              <p className="text-sm text-ink-muted">
                {enabledCount} of {totalToggleable} protection systems active
              </p>
            </div>
          </Panel>

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <MiniStat
              label="Active punishments"
              value={overview?.activePunishments ?? '—'}
            />
            <MiniStat
              label="Lockdown"
              value={overview?.lockdownActive ? 'Active' : 'Inactive'}
              tone={overview?.lockdownActive ? 'danger' : 'success'}
            />
            <MiniStat
              label="Realtime feed"
              value={realtimeConnected ? 'Connected' : 'Reconnecting…'}
              tone={realtimeConnected ? 'success' : 'warning'}
            />
            <MiniStat
              label="Bot status"
              value={overview?.botConnected ? 'Online' : 'Offline'}
              tone={overview?.botConnected ? 'success' : 'danger'}
            />
          </div>
        </div>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recent activity</h2>
            <a href={`/servers/${guildId}/logs`} className="text-xs text-violet-bright hover:underline">
              View all logs
            </a>
          </div>
          <div className="divide-y divide-line">
            {(overview?.recentEvents ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-ink-faint">
                Nothing's happened yet — activity will show up here as it comes in.
              </p>
            )}
            {overview?.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <CategoryBadge category={e.category} />
                  <span className="text-sm text-ink">{e.action.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-mono text-xs text-ink-faint">{timeAgo(e.createdAt)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'danger' | 'warning' }) {
  const colors = { neutral: 'text-ink', danger: 'text-coral', warning: 'text-amber' };
  return (
    <div>
      <p className={`font-display text-2xl font-bold ${colors[tone]}`}>{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const colors = { neutral: 'text-ink', success: 'text-mint', danger: 'text-coral', warning: 'text-amber' };
  return (
    <Panel className="p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${colors[tone]}`}>{value}</p>
    </Panel>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const tones: Record<string, 'info' | 'danger' | 'warning' | 'neutral' | 'success'> = {
    MODERATION: 'warning',
    SECURITY: 'danger',
    AUTOMOD: 'info',
    CONFIG: 'neutral',
    AUTH: 'success',
    BOT: 'neutral',
  };
  return <Badge tone={tones[category] ?? 'neutral'}>{category}</Badge>;
}
