'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import type { AuditLogEntry } from '@/lib/types';

const CATEGORIES = ['ALL', 'MODERATION', 'SECURITY', 'AUTOMOD', 'CONFIG', 'AUTH', 'BOT'] as const;

const CATEGORY_TONE: Record<string, 'info' | 'danger' | 'warning' | 'neutral' | 'success'> = {
  MODERATION: 'warning',
  SECURITY: 'danger',
  AUTOMOD: 'info',
  CONFIG: 'neutral',
  AUTH: 'success',
  BOT: 'neutral',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LogsPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ALL');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(reset: boolean) {
    setLoading(true);
    api
      .logs(guildId, { category: category === 'ALL' ? undefined : category, cursor: reset ? undefined : cursor ?? undefined })
      .then((res) => {
        setLogs((prev) => (reset ? res.logs : [...prev, ...res.logs]));
        setCursor(res.nextCursor);
      })
      .catch((err: ApiError) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, category]);

  return (
    <div>
      <TopBar title="Logs" />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c ? 'bg-violet text-white' : 'bg-base-800 text-ink-muted hover:text-ink border border-line'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <Panel>
          <div className="divide-y divide-line">
            {logs.length === 0 && !loading && (
              <p className="py-8 text-center text-sm text-ink-faint">No log entries in this category yet.</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="grid grid-cols-[100px_1fr_auto] items-center gap-4 py-3">
                <Badge tone={CATEGORY_TONE[log.category] ?? 'neutral'}>{log.category}</Badge>
                <div>
                  <p className="text-sm text-ink">{log.action.replace(/_/g, ' ')}</p>
                  <p className="font-mono text-xs text-ink-faint">
                    {log.actorId ? `by ${log.actorId}` : 'system'}
                    {log.targetId ? ` → ${log.targetId}` : ''}
                    {log.reason ? ` — ${log.reason}` : ''}
                  </p>
                </div>
                <span className="whitespace-nowrap font-mono text-xs text-ink-faint">{formatTime(log.createdAt)}</span>
              </div>
            ))}
          </div>

          {cursor && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => load(false)} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
