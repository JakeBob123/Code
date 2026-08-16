const configCache = require('./configCache');

// guildId -> executorId -> actionType -> timestamps[]
const actionWindows = new Map();

function recordAndCheck(guildId, executorId, actionType) {
  const config = configCache.getSecurity(guildId);
  const key = `${guildId}:${executorId}:${actionType}`;
  const now = Date.now();
  const windowMs = config.massActionWindowSeconds * 1000;

  if (!actionWindows.has(key)) actionWindows.set(key, []);
  const timestamps = actionWindows.get(key).filter((t) => now - t < windowMs);
  timestamps.push(now);
  actionWindows.set(key, timestamps);

  return timestamps.length >= config.massActionThreshold;
}

/**
 * Call this from event handlers (channelDelete, roleDelete, guildBanAdd,
 * guildMemberRemove-by-kick, webhook create, etc.) with the executor id
 * resolved from the audit log entry for that event.
 *
 * Returns { triggered: boolean, count } — the caller decides the punishment
 * (strip roles / kick / ban the executor) based on config.punishmentAction,
 * since the exact Discord call differs per action type and needs the guild
 * object already fetched in the event handler.
 */
async function checkAntiNuke(guild, executorId, actionType, { enabledFlag } = {}) {
  const config = configCache.getSecurity(guild.id);
  if (!config.antiNukeEnabled) return { triggered: false };
  if (enabledFlag && !config[enabledFlag]) return { triggered: false };
  if (executorId === guild.ownerId) return { triggered: false }; // never act against the owner
  if (executorId === guild.client.user.id) return { triggered: false }; // ignore the bot's own actions

  const triggered = recordAndCheck(guild.id, executorId, actionType);
  return { triggered, actionType, executorId };
}

async function punishExecutor(guild, executorId, punishmentAction, reason) {
  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return { punished: false };

    switch (punishmentAction) {
      case 'BAN':
        await guild.members.ban(executorId, { reason: `[Anti-Nuke] ${reason}` });
        break;
      case 'KICK':
        await member.kick(`[Anti-Nuke] ${reason}`);
        break;
      case 'STRIP_ROLES':
        await member.roles.set([], `[Anti-Nuke] ${reason}`);
        break;
      case 'QUARANTINE':
      default:
        // Quarantine = remove all roles and (if configured) apply a
        // "quarantined" role instead of full role removal. Kept generic
        // here; wire up a specific quarantine role id from guild config.
        await member.roles.set([], `[Anti-Nuke] Quarantined: ${reason}`);
        break;
    }
    return { punished: true, action: punishmentAction };
  } catch (err) {
    console.error(`[anti-nuke] failed to punish ${executorId}:`, err.message);
    return { punished: false, error: err.message };
  }
}

module.exports = { checkAntiNuke, punishExecutor };
