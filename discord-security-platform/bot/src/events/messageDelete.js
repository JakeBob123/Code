const { EVENTS } = require('../../../shared/constants');

module.exports = {
  name: 'messageDelete',
  async execute(message, { backendClient }) {
    if (!message.guild || message.author?.bot) return;
    backendClient.emit(EVENTS.MESSAGE_DELETE, message.guild.id, {
      authorId: message.author?.id,
      channelId: message.channel.id,
      contentSnippet: (message.content || '').slice(0, 200),
    });
  },
};
