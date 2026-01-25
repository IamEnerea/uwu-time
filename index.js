const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`☕🎀 Uwu Time está online como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
