const { ACTIONS } = require('../../../shared/constants');

/**
 * Every entry here mirrors an ACTIONS.* the backend can send. `ban` is the
 * fully-implemented reference; follow the same pattern (fetch guild ->
 * fetch target -> perform -> return {success, ...}) to fill in the rest.
 */
function buildActionHandlers(client) {
  return {
    [ACTIONS.BAN]: async (guildId, { userId, reason, deleteMessageSeconds = 0 }) => {
      const guild = await client.guilds.fetch(guildId);
      await guild.members.ban(userId, {
        reason: reason ? `[Dashboard] ${reason}` : '[Dashboard] No reason provided',
        deleteMessageSeconds,
      });
      return { success: true, userId, action: 'BAN' };
    },

    [ACTIONS.UNBAN]: async (guildId, { userId, reason }) => {
      const guild = await client.guilds.fetch(guildId);
      await guild.bans.remove(userId, reason ? `[Dashboard] ${reason}` : undefined);
      return { success: true, userId, action: 'UNBAN' };
    },

    [ACTIONS.KICK]: async (guildId, { userId, reason }) => {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      await member.kick(reason ? `[Dashboard] ${reason}` : '[Dashboard] No reason provided');
      return { success: true, userId, action: 'KICK' };
    },

    [ACTIONS.TIMEOUT]: async (guildId, { userId, durationMs, reason }) => {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      await member.timeout(durationMs, reason ? `[Dashboard] ${reason}` : undefined);
      return { success: true, userId, action: 'TIMEOUT' };
    },

    [ACTIONS.REMOVE_TIMEOUT]: async (guildId, { userId }) => {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      await member.timeout(null);
      return { success: true, userId, action: 'REMOVE_TIMEOUT' };
    },

    [ACTIONS.PURGE]: async (guildId, { channelId, count }) => {
      const guild = await client.guilds.fetch(guildId);
      const channel = await guild.channels.fetch(channelId);
      const deleted = await channel.bulkDelete(Math.min(count, 100), true);
      return { success: true, deletedCount: deleted.size };
    },

    [ACTIONS.SOFTBAN]: async (guildId, { userId, reason }) => {
      const guild = await client.guilds.fetch(guildId);
      await guild.members.ban(userId, { reason: '[Dashboard] Softban', deleteMessageSeconds: 86400 });
      await guild.bans.remove(userId, 'Softban cleanup');
      return { success: true, userId, action: 'SOFTBAN' };
    },

    [ACTIONS.LOCKDOWN_ENABLE]: async (guildId) => {
      const guild = await client.guilds.fetch(guildId);
      const everyone = guild.roles.everyone;
      const channels = await guild.channels.fetch();
      for (const [, channel] of channels) {
        if (channel?.isTextBased?.()) {
          await channel.permissionOverwrites
            .edit(everyone, { SendMessages: false })
            .catch(() => {});
        }
      }
      return { success: true };
    },

    [ACTIONS.LOCKDOWN_DISABLE]: async (guildId) => {
      const guild = await client.guilds.fetch(guildId);
      const everyone = guild.roles.everyone;
      const channels = await guild.channels.fetch();
      for (const [, channel] of channels) {
        if (channel?.isTextBased?.()) {
          await channel.permissionOverwrites
            .edit(everyone, { SendMessages: null })
            .catch(() => {});
        }
      }
      return { success: true };
    },

    [ACTIONS.CONFIG_UPDATE]: async (guildId, payload) => {
      // Update the bot's in-memory config cache immediately (see
      // security/configCache.js) so detection logic reflects the change
      // without a restart.
      require('./configCache').update(guildId, payload);
      return { success: true };
    },

    [ACTIONS.AUTOMOD_RULE_UPDATE]: async (guildId, { rule }) => {
      require('./configCache').upsertRule(guildId, rule);
      return { success: true };
    },
  };
}

module.exports = { buildActionHandlers };
