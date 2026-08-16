require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');

const { BackendClient } = require('./ws/backendClient');
const { buildActionHandlers } = require('./security/actions');
const { startHealthServer } = require('./healthServer');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration, // bans
    GatewayIntentBits.MessageContent, // required for AutoMod content scanning
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// -- Load the single slash command -----------------------------------------
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsDir)) {
  const command = require(path.join(commandsDir, file));
  commands.set(command.name, command);
}

// -- Load gateway event handlers, injecting shared context ------------------
const backendClient = new BackendClient({
  url: process.env.BACKEND_INTERNAL_WS_URL,
  secret: process.env.INTERNAL_WS_SHARED_SECRET,
  actionHandlers: buildActionHandlers(client),
});

const context = { backendClient, client };

const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir)) {
  const event = require(path.join(eventsDir, file));
  client.on(event.name, (...args) => event.execute(...args, context));
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error running /${interaction.commandName}:`, err);
    const reply = { content: 'Something went wrong running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`[bot] logged in as ${c.user.tag}`);
  backendClient.connect();
  startHealthServer(() => ({ discordConnected: client.isReady(), backendConnected: backendClient.ws?.readyState === 1 }));
});

client.login(process.env.DISCORD_BOT_TOKEN);

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
