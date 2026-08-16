# Architecture

## Request flow (dashboard action → Discord)

```
Browser                Backend (Express + WS)              Bot (discord.js)
  |  POST /api/servers/:id/moderation/ban                        |
  |----------------------------------------->|                   |
  |          requireAuth (JWT)               |                   |
  |          requireGuildPermission (live    |                   |
  |          re-check against Discord API)   |                   |
  |                                          |  action over       |
  |                                          |  internal WS  ---->|
  |                                          |                   | executes via
  |                                          |                   | discord.js REST
  |                                          |<---- result -------|
  |          write AuditLog + Punishment     |                   |
  |<--- 200 { ok, action }  -------------------|                   |
  |          broadcast to subscribed          |                   |
  |          dashboard sockets for this guild |                   |
  |<=== WS event: moderation.action ===========|                   |
```

## Event flow (Discord → dashboard, e.g. raid detection)

```
Discord gateway --> Bot event handler --> antiRaid.recordJoin()
                                        --> threshold crossed?
                                        --> antiRaid.respondToRaid() (kicks/bans)
                                        --> backendClient.emit(RAID_DETECTED, ...)
                                              |
                                              v
                                     Backend internal WS
                                              |
                              persists to AuditLog + broadcasts
                                              |
                                              v
                                 Every subscribed dashboard socket
                                 gets `security.raid_detected` instantly
```

## Adding a new action (e.g. `warn`)

1. **shared/constants.js** — add `WARN: 'moderation.warn'` to `ACTIONS` (already present) and its required permission.
2. **bot/src/security/actions.js** — add a `[ACTIONS.WARN]: async (guildId, payload) => {...}` handler that performs the Discord-side effect (or no-op if it's purely a record, like warn).
3. **backend/src/routes/moderation.js** — replace the `stub('warn')` with the same shape as `/ban`: validate → `requireGuildPermission` → `wsHub.sendAction` → persist to `Punishment`/`AuditLog` → `wsHub.broadcastToGuild`.
4. Nothing else needs to change — the internal WS protocol, auth, and audit logging are all generic.

## Adding a new anti-nuke detection

1. Find (or add) the Discord gateway event in `bot/src/events/`.
2. Resolve the executor via `resolveExecutor(guild, AuditLogEvent.X, targetId)`.
3. Call `antiNuke.checkAntiNuke(guild, executorId, 'YOUR_ACTION_TYPE', { enabledFlag: 'antiXEnabled' })`.
4. On `triggered`, call `antiNuke.punishExecutor(...)` and `backendClient.emit(EVENTS.NUKE_ATTEMPT_BLOCKED, ...)`.
5. Add the corresponding `antiXEnabled` boolean to `SecurityConfig` in `prisma/schema.prisma` and to `DEFAULT_SECURITY` in `bot/src/security/configCache.js`, and expose it in the security PATCH route's zod schema.

## Trust boundaries

- **Frontend → Backend**: JWT session cookie proves *who*; every guild-scoped
  route independently re-fetches the member's roles/permissions from Discord
  (`requireGuildPermission`) before acting — a stale or forged claim from the
  client is never sufficient.
- **Backend → Bot**: WebSocket at `/internal-ws` on the backend's single
  HTTP server, shared-secret header, meant to run where the two services
  can reach each other privately in production — never expose that path
  behind anything other than the backend's own TLS termination.
- **Bot → Discord**: the bot token lives only in the bot process.
- **Frontend**: only ever receives `PUBLIC_API_URL`, `PUBLIC_WS_URL`,
  `DISCORD_CLIENT_ID`, and the OAuth2 redirect URI — all public by design.

## Not yet implemented (intentionally scoped out of this pass)

- Multi-guild sharding for the bot (`botSocket` in `ws/server.js` currently
  assumes a single bot process; swap for a `Map<shardId, socket>` when you
  outgrow one process).
- Premium/licensing tier gating.
- AI-powered security analysis.
- Full automod rule editor UI (backend routes exist; frontend TBD in Canva AI).

These were called out as "eventually" goals in the spec — the foundation
here is built so none of them require touching the core request/event flow.
