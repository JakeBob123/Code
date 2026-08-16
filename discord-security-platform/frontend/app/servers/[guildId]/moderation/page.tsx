'use client';

import { useEffect, useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, ApiError } from '@/lib/api';
import type { Punishment } from '@/lib/types';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PUNISHMENT_TONE: Record<Punishment['type'], 'danger' | 'warning' | 'neutral'> = {
  BAN: 'danger',
  SOFTBAN: 'danger',
  KICK: 'warning',
  TIMEOUT: 'warning',
  WARN: 'neutral',
};

export default function ModerationPage({ params }: { params: { guildId: string } }) {
  const { guildId } = params;
  const [history, setHistory] = useState<Punishment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  function loadHistory() {
    api
      .moderationHistory(guildId)
      .then((res) => setHistory(res.punishments))
      .catch((err: ApiError) => setError(err.message));
  }

  useEffect(loadHistory, [guildId]);

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.banUser(guildId, form.userId.trim(), form.reason.trim() || undefined);
      setSuccess(`Banned ${form.userId.trim()}`);
      setForm({ userId: '', reason: '' });
      loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ban failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Moderation" />
      <div className="space-y-6 p-8">
        {error && <Panel className="border-coral/30 text-sm text-coral">{error}</Panel>}
        {success && <Panel className="border-mint/30 text-sm text-mint">{success}</Panel>}

        <Panel>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">Ban a user</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Sends the action to the bot in real time and records it to the audit log — this is the fully wired
            reference action; other actions in this build follow the same path.
          </p>
          <form onSubmit={handleBan} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs text-ink-muted">User ID</label>
              <input
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                placeholder="Discord user ID"
                className="w-full rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="mb-1 block text-xs text-ink-muted">Reason (optional)</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Why this user is being banned"
                className="w-full rounded-lg border border-line bg-base-800 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none"
              />
            </div>
            <Button type="submit" variant="danger" disabled={submitting || !form.userId.trim()}>
              {submitting ? 'Banning…' : 'Ban user'}
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">Other actions</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Unban, kick, timeout, warn, purge, and softban are scaffolded on the backend and ready to wire up the
            same way as ban above.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Unban', 'Kick', 'Timeout', 'Warn', 'Purge', 'Softban'].map((label) => (
              <Button key={label} variant="secondary" disabled title="Not yet wired — follows the ban pattern">
                {label}
              </Button>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="mb-4 font-display text-base font-semibold text-ink">Punishment history</h2>
          <div className="divide-y divide-line">
            {history.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">No punishments recorded yet.</p>}
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Badge tone={PUNISHMENT_TONE[p.type]}>{p.type}</Badge>
                  <span className="font-mono text-sm text-ink">{p.userId}</span>
                  {p.reason && <span className="text-sm text-ink-muted">— {p.reason}</span>}
                </div>
                <span className="font-mono text-xs text-ink-faint">{timeAgo(p.createdAt)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
