# Deploying to Render (free tier)

## What's free and what isn't

Render's free tier covers **Web Services** and a **free Postgres instance**.
It does **not** have a free Background Worker tier — those start at $7/mo.
Since the bot doesn't naturally serve HTTP, it's deployed here as a Web
Service with a trivial health-check server (`bot/src/healthServer.js`) so it
qualifies for the free plan. This is a real workaround, not a hidden cost —
worth knowing going in.

## One-time setup

1. Push this repo to GitHub (Render deploys from a connected repo).
2. In the Render dashboard: **New → Blueprint**, point it at the repo. It
   reads `render.yaml` at the root and creates all three services plus the
   database in one pass.
3. Render will pause on the `sync: false` env vars and ask you to fill them
   in per service:
   - **aegis-backend**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
     `DISCORD_BOT_TOKEN`, `DISCORD_OAUTH_REDIRECT_URI`, `FRONTEND_ORIGIN`
   - **aegis-bot**: `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DASHBOARD_URL`
   - **aegis-dashboard**: `NEXT_PUBLIC_DISCORD_CLIENT_ID`
4. **`INTERNAL_WS_SHARED_SECRET` needs to match on both `aegis-backend` and
   `aegis-bot`.** The blueprint generates it automatically for the backend
   (`generateValue: true`) — copy that generated value from the backend
   service's environment tab into the bot service's `INTERNAL_WS_SHARED_SECRET`
   manually. Render doesn't let a Blueprint share a generated secret across
   two services automatically.
5. Once all three services show "Live," go to the Discord Developer Portal
   and set your OAuth2 redirect URI to
   `https://aegis-backend.onrender.com/api/auth/discord/callback` (or
   whatever your actual backend URL is).
6. Run `bot/src/registerCommands.js` once (locally, pointed at production
   env vars, or as a Render one-off job) to register `/dashboard`.

## The sleep problem

Free web services spin down after **15 minutes of no inbound HTTP traffic**.
For the frontend and backend, that's an annoyance — the first visitor after
a quiet period waits ~30–60 seconds for cold start. For the **bot**, it's
worse: no inbound traffic means no reason for Render to keep the process
alive, which kills the Discord gateway connection and the bot goes offline
until something wakes it back up. A moderation bot that's asleep isn't
moderating.

**Workaround**: an uptime pinger (UptimeRobot, cron-job.org) hitting each
service's health endpoint every 5–10 minutes:
- Backend: `GET https://aegis-backend.onrender.com/api/health`
- Bot: `GET https://aegis-bot.onrender.com/`
- Frontend: `GET https://aegis-dashboard.onrender.com/`

This is a widely used trick, not a guaranteed one — Render has tightened
spin-down enforcement over time and may do so again. Treat this whole setup
as good for testing and demos, not as something to trust for a server
that's actually depending on the bot for protection.

**When you're ready for real use**: upgrade `aegis-backend` and `aegis-bot`
to Starter plan (~$7/mo each) to remove spin-down entirely. The frontend can
usually stay free longest since a sleepy dashboard is a minor inconvenience,
not a security gap.

## The database expiry problem

Render's free Postgres **expires after 30–90 days** and is deleted, not
paused — you'd need to recreate it and lose data. For anything beyond
testing, either upgrade the database to a paid instance or point
`DATABASE_URL` at a separate persistent free tier (Supabase's free Postgres
doesn't have this expiry).

## Verifying it's actually working

1. Visit the dashboard URL, log in with Discord, pick a server.
2. Check `aegis-backend`'s `/api/health` — `botConnected` should be `true`
   once the bot has connected over `/internal-ws`.
3. Try the Overview page's realtime indicator — it should show "Connected"
   once the dashboard's `/public-ws` subscription goes through.
4. Ban a test account from the Moderation page and confirm it shows up in
   Logs — this exercises the full loop (dashboard → backend → bot → Discord
   → audit log → broadcast) end to end.
