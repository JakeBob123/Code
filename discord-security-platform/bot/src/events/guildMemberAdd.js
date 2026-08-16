const { EVENTS } = require('../../../shared/constants');
const antiRaid = require('../security/antiRaid');
const configCache = require('../security/configCache');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, { backendClient }) {
    const config = configCache.getSecurity(member.guild.id);

    backendClient.emit(EVENTS.MEMBER_JOIN, member.guild.id, {
      userId: member.id,
      accountCreatedAt: member.user.createdAt,
    });

    if (!config.antiRaidEnabled && !config.joinProtectionEnabled) return;

    const { entries, thresholdCrossed } = antiRaid.recordJoin(member.guild.id, member);
    if (!thresholdCrossed) return;

    const result = await antiRaid.respondToRaid(member.guild, entries);
    backendClient.emit(EVENTS.RAID_DETECTED, member.guild.id, result);
  },
};
