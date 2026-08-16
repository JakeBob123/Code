'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AegisMark } from '@/components/shell/AegisMark';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { api, API_URL, ApiError } from '@/lib/api';
import type { ManageableGuild } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<ManageableGuild[] | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api
      .manageableGuilds()
      .then((res) => {
        setGuilds(res.guilds);
        setLoggedIn(true);
      })
      .catch((err: ApiError) => {
        if (err.status === 401) setLoggedIn(false);
        else setLoggedIn(false);
      });
  }, []);

  const filtered = (guilds ?? []).filter((g) => g.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="mb-12 flex items-center gap-3">
        <AegisMark className="h-9 w-9" />
        <span className="font-display text-2xl font-bold tracking-tight text-ink">Aegis</span>
      </div>

      {loggedIn === false && (
        <div className="max-w-md text-center">
          <h1 className="mb-3 font-display text-3xl font-bold text-ink">Sign in to manage your servers</h1>
          <p className="mb-8 text-sm text-ink-muted">
            Aegis authenticates through Discord and only shows servers you actually have permission to manage.
          </p>
          <a href={`${API_URL}/api/auth/discord/login`}>
            <Button className="px-6 py-3 text-base">Continue with Discord</Button>
          </a>
        </div>
      )}

      {loggedIn === null && <p className="text-sm text-ink-faint">Checking your session…</p>}

      {loggedIn && (
        <div className="w-full max-w-3xl">
          <p className="mb-1 text-center text-xs uppercase tracking-wider text-ink-faint">Servers</p>
          <h1 className="mb-6 text-center font-display text-3xl font-bold text-ink">
            Select the server you want to manage
          </h1>

          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search servers…"
            className="mb-6 w-full rounded-lg border border-line bg-base-800 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-violet focus:outline-none"
          />

          {filtered.length === 0 && (
            <Panel className="text-center text-sm text-ink-faint">
              {guilds?.length === 0
                ? "No manageable servers found — you'll need Manage Server permission (or ownership) on a server Aegis is in."
                : 'No servers match that search.'}
            </Panel>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => router.push(`/servers/${g.id}`)}
                className="panel flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-shadow hover:shadow-glow"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-base-700 font-display text-lg font-bold text-ink-muted">
                  {g.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    g.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-ink">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
