require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// This is the ONLY Discord slash command the bot registers. Everything
// else is controlled through the website — see README for why.
const commands = [
  new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Open the security dashboard for this server')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Registering /dashboard as a global command...');
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
    console.log('Done. (Global commands can take up to an hour to propagate.)');
  } catch (err) {
    console.error('Failed to register commands:', err);
    process.exit(1);
  }
})();
