/**
 * Discord doesn't include "who did this" on most gateway delete/create
 * events directly — you have to cross-reference the guild's audit log for
 * a matching entry created in the last few seconds. This is the standard
 * pattern anti-nuke bots use.
 */
async function resolveExecutor(guild, auditLogType, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditLogType, limit: 5 });
    const entry = logs.entries.find(
      (e) => (!targetId || e.target?.id === targetId) && Date.now() - e.createdTimestamp < 5000
    );
    return entry?.executor?.id || null;
  } catch (err) {
    console.error('[resolveExecutor] failed:', err.message);
    return null;
  }
}

module.exports = { resolveExecutor };
