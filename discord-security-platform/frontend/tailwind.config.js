/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0A0E1A', // page background
          900: '#0D1224',
          800: '#12172B', // panel surfaces
          700: '#1B2140', // raised surfaces / hover
          600: '#2A2F52',
        },
        line: '#232A4A', // hairline borders
        ink: {
          DEFAULT: '#E8EAF6', // primary text
          muted: '#8B92B8', // secondary text
          faint: '#565D82', // tertiary / placeholder
        },
        violet: {
          DEFAULT: '#7C5CFC',
          bright: '#9B82FF',
          dim: '#4C3A9E',
        },
        cyan: {
          DEFAULT: '#4FD1FF',
          dim: '#2E7A94',
        },
        mint: '#34D399',
        amber: '#FBBF24',
        coral: '#F87171',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,252,0.25), 0 0 24px rgba(124,92,252,0.15)',
        'glow-cyan': '0 0 0 1px rgba(79,209,255,0.25), 0 0 24px rgba(79,209,255,0.12)',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '80%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        sweep: 'sweep 4s linear infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0,0,0.2,1) infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
