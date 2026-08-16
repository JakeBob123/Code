'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { api, ApiError } from '@/lib/api';
import type { ManagementData } from '@/lib/types';

const CHANNEL_TYPE_LABEL: Record<number, string> = {
  0: 'Text',
  2: 'Voice',
  4: 'Category',
  5: 'Announcement',
  13: 'Stage',
  15: 'Forum',
};

function roleColor(color: number) {
  if (!color) return '#8B92B8';
  return `#${color.toString(16).padStart(6, '0')}`;
}

export default function ServerManagementPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [data, setData] = useState<ManagementData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .management(guildId)
      .then(setData)
      .catch((err: ApiError) => setError(err.message));
  }, [guildId]);

  return (
    <div>
      <TopBar title="Server Management" guildName={data?.name} />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}

        {data && (
          <div className="grid grid-cols-3 gap-4">
            <Panel className="p-4">
              <p className="text-xs text-ink-muted">Owner</p>
              <p className="mt-1 font-mono text-sm text-ink">{data.ownerId}</p>
            </Panel>
            <Panel className="p-4">
              <p className="text-xs text-ink-muted">Members</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{data.memberCount ?? '—'}</p>
            </Panel>
            <Panel className="p-4">
              <p className="text-xs text-ink-muted">Roles / Channels</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                {data.roles.length} / {data.channels.length}
              </p>
            </Panel>
          </div>
        )}

        <Panel>
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Roles</h2>
          {!data ? (
            <p className="text-sm text-ink-faint">Loading…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-base-800 px-3 py-1.5 text-xs"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: roleColor(role.color) }} />
                  <span className="text-ink">{role.name}</span>
                  {role.managed && <span className="text-ink-faint">(bot)</span>}
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Channels</h2>
          {!data ? (
            <p className="text-sm text-ink-faint">Loading…</p>
          ) : (
            <div className="divide-y divide-line">
              {data.channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink">{channel.name}</span>
                  <span className="rounded-full bg-base-700 px-2.5 py-0.5 text-xs text-ink-muted">
                    {CHANNEL_TYPE_LABEL[channel.type] ?? `Type ${channel.type}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
