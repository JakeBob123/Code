export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-base-700 text-ink-muted',
    success: 'bg-mint/10 text-mint',
    warning: 'bg-amber/10 text-amber',
    danger: 'bg-coral/10 text-coral',
    info: 'bg-cyan/10 text-cyan',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function LiveDot({ live }: { live: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {live && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-mint animate-pulseRing" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-mint' : 'bg-ink-faint'}`} />
    </span>
  );
}
