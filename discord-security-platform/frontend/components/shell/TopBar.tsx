'use client';

import { LiveDot } from '../ui/Badge';

export function TopBar({
  title,
  guildName,
  botConnected,
}: {
  title: string;
  guildName?: string;
  botConnected?: boolean;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-8 py-5">
      <div>
        {guildName && <p className="text-xs uppercase tracking-wider text-ink-faint">{guildName}</p>}
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
      </div>
      {botConnected !== undefined && (
        <div className="flex items-center gap-2 rounded-full border border-line bg-base-800 px-3 py-1.5 text-xs text-ink-muted">
          <LiveDot live={botConnected} />
          {botConnected ? 'Bot connected' : 'Bot offline'}
        </div>
      )}
    </header>
  );
}
