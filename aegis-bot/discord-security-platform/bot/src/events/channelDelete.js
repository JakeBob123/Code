const { AuditLogEvent } = require('discord.js');
const { EVENTS } = require('../../../shared/constants');
const { resolveExecutor } = require('../utils/resolveExecutor');
const antiNuke = require('../security/antiNuke');
const configCache = require('../security/configCache');

module.exports = {
  name: 'channelDelete',
  async execute(channel, { backendClient }) {
    if (!channel.guild) return;
    const executorId = await resolveExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    if (!executorId) return;

    backendClient.emit(EVENTS.CHANNEL_CHANGE, channel.guild.id, {
      type: 'DELETE',
      channelId: channel.id,
      channelName: channel.name,
      executorId,
    });

    const check = await antiNuke.checkAntiNuke(channel.guild, executorId, 'CHANNEL_DELETE', {
      enabledFlag: 'antiChannelDeleteEnabled',
    });
    if (!check.triggered) return;

    const config = configCache.getSecurity(channel.guild.id);
    const punishResult = await antiNuke.punishExecutor(
      channel.guild,
      executorId,
      config.punishmentAction,
      'Mass channel deletion detected'
    );

    backendClient.emit(EVENTS.NUKE_ATTEMPT_BLOCKED, channel.guild.id, {
      type: 'CHANNEL_DELETE',
      executorId,
      ...punishResult,
    });
  },
};
