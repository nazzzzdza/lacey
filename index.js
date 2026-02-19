// Lacey Discord Bot
const { Client, GatewayIntentBits } = require("discord.js");
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
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`Lacey is online as ${client.user.tag}`);

  // Measure bot latency
  const latency = Date.now() - client.readyTimestamp;
  console.log(`lacey latency: ${latency}ms`);

  // ---------------------------
  // Streaming status (purple icon)
  // ---------------------------
  client.user.setPresence({
    activities: [{
      name: "checking your orders <3",
      type: 1, // 1 = Streaming
      url: "https://www.twitch.tv/laceyshp" // <-- REPLACE with your Twitch URL
    }],
    status: "online"
  });
});

// ---------------------------
// Login with bot token securely
// ---------------------------
client.login(process.env.TOKEN);
