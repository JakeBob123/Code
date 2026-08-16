const { EVENTS } = require('../../../shared/constants');
const automod = require('../security/automod');

async function applyPunishment(message, action, reason) {
  switch (action) {
    case 'DELETE':
      await message.delete().catch(() => {});
      break;
    case 'WARN':
      await message.delete().catch(() => {});
      // Persisted warning happens on the backend via the moderation.warn
      // action — here we just flag it for the audit trail.
      break;
    case 'TIMEOUT':
      await message.delete().catch(() => {});
      await message.member?.timeout(5 * 60 * 1000, `[AutoMod] ${reason}`).catch(() => {});
      break;
    case 'KICK':
      await message.member?.kick(`[AutoMod] ${reason}`).catch(() => {});
      break;
    case 'BAN':
      await message.guild.members.ban(message.author.id, { reason: `[AutoMod] ${reason}` }).catch(() => {});
      break;
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message, { backendClient }) {
    if (message.author.bot || !message.guild) return;

    const violation = automod.evaluateCustomRules(message) || automod.evaluateMessage(message);
    if (!violation) return;

    await applyPunishment(message, violation.action, violation.violation);

    backendClient.emit(EVENTS.AUTOMOD_TRIGGER, message.guild.id, {
      userId: message.author.id,
      channelId: message.channel.id,
      violation: violation.violation,
      action: violation.action,
      messageContentSnippet: (message.content || '').slice(0, 200),
    });
  },
};
