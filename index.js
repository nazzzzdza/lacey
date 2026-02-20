// Lacey Discord Bot
const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// Web server to keep Render awake
// ---------------------------
app.get("/", (req, res) => {
  res.send("Lacey is alive, checking your orders!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ---------------------------
// Discord client
// ---------------------------
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

client.commands = new Collection();

// ---------------------------
// Load slash commands dynamically
// ---------------------------
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // Only register slash commands
  if (command.data) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Load message handlers
const stickyCommand = require("./commands/sticky");
const autoResponder = require("./commands/autoresponder");

// ---------------------------
// Register slash commands
// ---------------------------
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`Lacey is online as ${client.user.tag}`);

  const latency = Date.now() - client.readyTimestamp;
  console.log(`lacey's latency: ${latency}ms`);

  client.user.setPresence({
    activities: [{
      name: "checking your orders <3",
      type: 1,
      url: "https://www.twitch.tv/laceyshp"
    }],
    status: "online"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
});

// ---------------------------
// Handle interactions
// ---------------------------
client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing that command, dm naz with ss.",
        ephemeral: true
      });
    }
  }

  else if (interaction.isButton()) {
    for (const command of client.commands.values()) {
      if (typeof command.handleInteraction === "function") {
        try {
          await command.handleInteraction(interaction);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

// ---------------------------
// Handle normal messages
// ---------------------------
client.on("messageCreate", async (message) => {
  stickyCommand.handleMessage(message);
  autoResponder.handleMessage(message);
});

// ---------------------------
// Login
// ---------------------------
client.login(process.env.TOKEN);
