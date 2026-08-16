'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AegisMark } from './AegisMark';

const NAV = [
  { href: '', label: 'Overview', icon: OverviewIcon },
  { href: '/security', label: 'Security', icon: SecurityIcon },
  { href: '/automod', label: 'AutoMod', icon: AutomodIcon },
  { href: '/moderation', label: 'Moderation', icon: ModerationIcon },
  { href: '/logs', label: 'Logs', icon: LogsIcon },
  { href: '/config', label: 'Configuration', icon: ConfigIcon },
  { href: '/server-management', label: 'Server', icon: ServerIcon },
];

export function Sidebar({ guildId }: { guildId: string }) {
  const pathname = usePathname();
  const base = `/servers/${guildId}`;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-base-900/60">
      <div className="flex items-center gap-2 px-5 py-6">
        <AegisMark />
        <span className="font-display text-lg font-bold tracking-tight text-ink">Aegis</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const target = `${base}${href}`;
          const active = pathname === target;
          return (
            <Link
              key={href}
              href={target}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-violet/15 text-violet-bright shadow-glow'
                  : 'text-ink-muted hover:bg-base-700 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4">
        <Link href="/" className="text-xs text-ink-faint hover:text-ink-muted">
          ← Switch server
        </Link>
      </div>
    </aside>
  );
}

function OverviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}
function SecurityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2l7 3v4c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V5l7-3z" />
    </svg>
  );
}
function AutomodIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  );
}
function ModerationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 10a6 6 0 1112 0 6 6 0 01-12 0z" />
      <path d="M8 10l1.5 1.5L13 8" />
    </svg>
  );
}
function LogsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 3h9l3 3v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M6.5 9h7M6.5 12h7M6.5 15h4" />
    </svg>
  );
}
function ConfigIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3L4.9 4.9" />
    </svg>
  );
}
function ServerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="14" height="5" rx="1.5" />
      <rect x="3" y="11" width="14" height="5" rx="1.5" />
      <circle cx="6" cy="6.5" r="0.6" fill="currentColor" />
      <circle cx="6" cy="13.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
