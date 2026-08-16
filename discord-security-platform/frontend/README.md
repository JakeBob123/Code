# Aegis — Dashboard

Next.js (App Router) + TypeScript + Tailwind frontend for the platform. Talks
directly to `../backend` over REST + the public WebSocket — no other layer
in between.

## Design

- **Palette**: near-black indigo background, violet primary accent, cyan for
  live/data elements. Full token list in `tailwind.config.js`.
- **Type**: Space Grotesk (display), Inter (UI text), JetBrains Mono (IDs,
  hashes, log entries).
- **Signature element**: `components/overview/ThreatRing.tsx` — an animated
  radar-sweep security score on the Overview page.

This is an original design built for this project — not a clone of any
existing product's UI, branding, or copy.

## Pages

| Route | Backend endpoints used |
|---|---|
| `/` | `GET /api/auth/discord/manageable-guilds` |
| `/servers/:id` (Overview) | `GET /overview`, `GET /security` + realtime WS |
| `/servers/:id/security` | `GET/PATCH /security`, `POST /security/lockdown/*` |
| `/servers/:id/automod` | `GET/PATCH /automod`, `POST/DELETE /automod/rules` |
| `/servers/:id/moderation` | `POST /moderation/ban` (fully wired), `GET /moderation/history` |
| `/servers/:id/logs` | `GET /logs` |
| `/servers/:id/config` | `GET/PATCH /security` (punishment action, account age) |
| `/servers/:id/server-management` | `GET /management` |

Kick/timeout/warn/purge/softban buttons are visibly present but disabled —
the backend routes exist as stubs (see `backend/src/routes/moderation.js`);
wiring each one up is copy-the-`ban`-pattern work, not new design.

## Running it

```bash
cp .env.local.example .env.local   # point at your running backend
npm install
npm run dev
```

Requires the backend (and its Postgres + the bot's internal WS connection)
to be running for anything beyond the login screen to work — this is a real
client, not a mock.

## Build note

`npm run build` fetches Space Grotesk / Inter / JetBrains Mono from Google
Fonts at build time via `next/font/google`, so the build machine needs
outbound access to `fonts.googleapis.com`. Verified compiling cleanly
(TypeScript + all 8 routes) in this environment with a temporary
system-font swap, since this sandbox's network is restricted; on a normal
machine or CI runner it'll fetch the real fonts with no changes needed.
