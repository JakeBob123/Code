import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-violet text-white hover:bg-violet-bright shadow-glow',
  secondary: 'bg-base-700 text-ink hover:bg-base-600 border border-line',
  danger: 'bg-coral/15 text-coral hover:bg-coral/25 border border-coral/30',
  ghost: 'text-ink-muted hover:text-ink hover:bg-base-700',
};

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
