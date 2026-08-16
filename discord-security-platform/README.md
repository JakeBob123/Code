# Aegis — Discord Security Platform (Wick-style, website-controlled)

A four-part system:

```
Aegis Dashboard (Next.js — frontend/)
    │  HTTPS (REST) + WSS (realtime)
    ▼
Backend  ── secure control plane: auth, permission checks, audit log, DB
    │  internal WebSocket (bot ⇄ backend)
    ▼
Discord Bot ── execution + detection engine, only exposes /dashboard
    │  discord.js REST/gateway
    ▼
Discord
```

- **`frontend/`** — the Aegis dashboard itself: Next.js + TypeScript +
  Tailwind, an original design (see `frontend/README.md`). Talks to the
  backend below over REST + WebSocket — nothing else in between.

- **`bot/`** — discord.js v14 bot. Only slash command is `/dashboard`. Listens to
  gateway events for security detection (anti-nuke, anti-raid, automod) and
  executes actions (ban/kick/timeout/etc.) that the backend tells it to run.
  Connects **outbound** to the backend over a private WebSocket — the bot
  never exposes a public port and the frontend never talks to it directly.

- **`backend/`** — Express REST API + WebSocket hub. This is the only thing
  the frontend ever talks to. It:
  - Authenticates users via Discord OAuth2, issues its own short-lived JWT.
  - Independently re-verifies Discord guild membership + permissions on
    *every* request (never trusts anything the frontend claims).
  - Forwards approved actions to the bot over the internal WS, and relays
    the bot's realtime events (raid detected, member joined, action result,
    etc.) back out to subscribed dashboard clients over the public WS.
  - Owns the database (Postgres via Prisma): audit log, guild config,
    automod rules, punishment history, sessions.

- **`shared/`** — constants and payload shapes used by both bot and backend
  so the two sides can't drift out of sync (action types, event names,
  permission flags).

## Secrets

| Secret                     | Lives in     |
|-----------------------------|---------------|
| `DISCORD_BOT_TOKEN`         | bot only      |
| `DISCORD_CLIENT_SECRET`     | backend only  |
| `INTERNAL_WS_SHARED_SECRET` | bot + backend |
| `JWT_SIGNING_SECRET`        | backend only  |
| `DATABASE_URL`              | backend only  |

The frontend only ever receives: `PUBLIC_API_URL`, `PUBLIC_WS_URL`,
`DISCORD_CLIENT_ID` (public), `DISCORD_OAUTH_REDIRECT_URI`. None of the
values above are ever sent to it.

## End-to-end example implemented in this skeleton

`Ban User` click on the dashboard is wired **fully end to end** as the
reference implementation — trace it through to see the whole pattern:

1. `POST /api/servers/:guildId/moderation/ban` (backend/src/routes/moderation.js)
2. `requireAuth` + `requireGuildPermission('BAN_MEMBERS')` middleware verify
   the session against live Discord data (not cached/trusted claims)
3. Backend calls `botConnection.sendAction()` (backend/src/ws/server.js)
4. Bot receives it in `bot/src/ws/backendClient.js`, executes via
   `bot/src/security/actions.js`, and reports the result back
5. Backend writes an audit log row and broadcasts `moderation.action` to
   every dashboard client subscribed to that guild
6. Frontend WS listener updates the UI instantly, no polling

Every other action (kick, timeout, warn, purge, security-config changes,
automod rule changes) follows this exact same shape — see
`docs/ARCHITECTURE.md` for the full action catalog and how to add a new one.

## Deploying

See `docs/DEPLOY_RENDER.md` for a full walkthrough deploying all three
services + Postgres to Render's free tier via the included `render.yaml`
Blueprint — including the honest tradeoffs (spin-down on idle, free DB
expiry) and when to move to a paid plan.

## Getting started (local dev)

```bash
# backend
cd backend && cp .env.example .env && npm install
npx prisma migrate dev
npm run dev

# bot
cd bot && cp .env.example .env && npm install
npm run dev

# frontend
cd frontend && cp .env.local.example .env.local && npm install
npm run dev
```
