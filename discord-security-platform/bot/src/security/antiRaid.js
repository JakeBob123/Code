const configCache = require('./configCache');

// guildId -> array of { member, timestamp }
const joinWindows = new Map();

/**
 * Call from the guildMemberAdd handler. Tracks join velocity and, once the
 * configured threshold is crossed within the window, flags a raid and
 * returns the batch of recent joiners so the caller can apply
 * join-protection punishments and report accurate counts back to the
 * dashboard (accounts detected / blocked / kicked).
 */
function recordJoin(guildId, member) {
  const now = Date.now();
  if (!joinWindows.has(guildId)) joinWindows.set(guildId, []);
  const config = configCache.getSecurity(guildId);
  const windowMs = config.raidJoinWindowSeconds * 1000;

  const entries = joinWindows.get(guildId).filter((e) => now - e.timestamp < windowMs);
  entries.push({ member, timestamp: now });
  joinWindows.set(guildId, entries);

  return { entries, thresholdCrossed: entries.length >= config.raidJoinThreshold };
}

function isSuspiciousAccount(member, config) {
  if (!config.minAccountAgeMinutes) return false;
  const ageMinutes = (Date.now() - member.user.createdTimestamp) / 60_000;
  return ageMinutes < config.minAccountAgeMinutes;
}

/**
 * Runs the actual anti-raid response once a raid is flagged: kicks/bans
 * suspicious (too-new) accounts among the recent joiners, per
 * config.punishmentAction, and returns counts for the RAID_DETECTED event.
 */
async function respondToRaid(guild, entries) {
  const config = configCache.getSecurity(guild.id);
  let blocked = 0;
  let kicked = 0;

  for (const { member } of entries) {
    if (!isSuspiciousAccount(member, config)) continue;
    try {
      if (config.punishmentAction === 'BAN') {
        await guild.members.ban(member.id, { reason: '[Anti-Raid] Suspicious join during raid' });
        blocked++;
      } else {
        await member.kick('[Anti-Raid] Suspicious join during raid');
        kicked++;
      }
    } catch (err) {
      console.error(`[anti-raid] failed to act on ${member.id}:`, err.message);
    }
  }

  return {
    accountsDetected: entries.length,
    accountsBlocked: blocked,
    accountsKicked: kicked,
    detectionTime: new Date().toISOString(),
  };
}

module.exports = { recordJoin, respondToRaid, isSuspiciousAccount };
