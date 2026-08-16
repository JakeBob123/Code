'use client';

/**
 * Aegis's signature element. A security score expressed as a radar sweep
 * rather than a static donut — the rotating scan line reads as "actively
 * watching," which is the actual value proposition of the product, not
 * just a number in a circle.
 */
export function ThreatRing({ score, alert = false }: { score: number; alert?: boolean }) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - clamped / 100);
  const color = alert ? '#F87171' : clamped > 70 ? '#34D399' : clamped > 40 ? '#FBBF24' : '#F87171';

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#1B2140" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {/* radar sweep overlay, clipped to the ring's circular field */}
      <div className="absolute inset-3 overflow-hidden rounded-full">
        <div
          className={`absolute inset-0 animate-sweep origin-center ${alert ? '[animation-duration:1.2s]' : ''}`}
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${color}33 25deg, transparent 60deg)`,
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink">{clamped}%</span>
        <span className="text-[11px] uppercase tracking-wider text-ink-muted">
          {alert ? 'Threat active' : 'Protected'}
        </span>
      </div>
    </div>
  );
}
