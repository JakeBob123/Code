const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'dashboard',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Security Dashboard')
      .setDescription('Manage security, moderation, AutoMod, and logs for this server from the web dashboard.')
      .setFooter({ text: interaction.guild?.name || 'Direct Message' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Open Security Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL(`${process.env.DASHBOARD_URL}/servers/${interaction.guildId}`)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
