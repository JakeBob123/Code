const { AuditLogEvent } = require('discord.js');
const { EVENTS } = require('../../../shared/constants');
const { resolveExecutor } = require('../utils/resolveExecutor');
const antiNuke = require('../security/antiNuke');
const configCache = require('../security/configCache');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, { backendClient }) {
    const executorId = await resolveExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    if (!executorId) return;

    const check = await antiNuke.checkAntiNuke(ban.guild, executorId, 'MASS_BAN', {
      enabledFlag: 'antiMassBanEnabled',
    });
    if (!check.triggered) return;

    const config = configCache.getSecurity(ban.guild.id);
    const punishResult = await antiNuke.punishExecutor(
      ban.guild,
      executorId,
      config.punishmentAction,
      'Mass ban detected'
    );

    backendClient.emit(EVENTS.NUKE_ATTEMPT_BLOCKED, ban.guild.id, {
      type: 'MASS_BAN',
      executorId,
      ...punishResult,
    });
  },
};
