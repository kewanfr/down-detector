import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, userMention } from "discord.js";
import config from "./config.js";
import sendDiscordMessage from "./utils/sendMessage.js";
import fs from "fs";
import { actualTime, fetchStatusMessage, pingHost, statusEmbed, StatusNOKEmbed, StatusOKEmbed } from "./utils/functions.js";

if (!fs.existsSync(config.files.DATA_FOLDER)) {
  fs.mkdirSync(config.files.DATA_FOLDER);
}

if (!fs.existsSync(config.files.DEVICES_FILE)) {
  fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(config.devices));
}

function readData() {
  return new Promise((resolve, reject) => {
      fs.readFile(config.files.DEVICES_FILE, (err, data) => {
          if (err) {
              reject(err);
          }
          resolve(JSON.parse(data));
      });
  });
}

async function watchDevice(device) {
  const res = await pingHost(device.ip);

  console.log(`[${actualTime()}] Device ${device.name} - ${device.ip} is ${res.alive ? "alive" : "dead"} ${res.alive ? `with a ping of ${res.time}ms` : ""}`);

  if (!device.lastPing) {
    device.lastPing = "";
  }

  device.ping = res.time;

  var updated = false;

  if (res.alive && (device.alive != res.alive)) {
    updated = true;
    sendDiscordMessage([StatusOKEmbed(device)], `${userMention(config.discord.USER_ID)}`);
  } else if (!res.alive && (device.alive != res.alive)) {
    updated = true;
    sendDiscordMessage([StatusNOKEmbed(device)], `${userMention(config.discord.USER_ID)}`);
  }

  const data = await readData();
  data[device.name].alive = res.alive;
  data[device.name].ping = res.time;
  data[device.name].lastPing = res.alive ? Math.floor(Date.now() / 1000) : (data[device.name]?.lastPing || "");

  await fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(data));

  return updated;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!").toJSON(),
  new SlashCommandBuilder()
    .setName("update")
    .setDescription("Ping all devices and update status message").toJSON(),
]

async function watch(updateEmbed = false) {

  var devices = await readData();

  for (const name in config.devices) {
    if (!devices[name]) {
      devices[name] = config.devices[name];
    }
  }

  await fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(devices));

  let updated = false;
  console.log(`[${actualTime()}] Watching devices...`);
  for (const name in devices) {
    const device = devices[name];
    let res = await watchDevice(device);
    console.log(`[${actualTime()}] Device ${device.name} - ${device.ip} updated: ${res}`);
    if (res) {
      updated = true;
    }
  }

  if (updated || updateEmbed) {
    devices = await readData();

    const embed = await statusEmbed(devices);

    const message = await fetchStatusMessage(client);

    if (message) {
      message.edit({ embeds: [embed] });
    } else {
      await client.channels.cache.find(channel => channel.name === config.discord.status_channel).send({ embeds: [embed] });
    }
  }
  return true;
}

const rest = new REST({ version: '10' }).setToken(config.discord.TOKEN);

const data = await rest.put(
  Routes.applicationGuildCommands(config.discord.CLIENT_ID, config.discord.GUILD_ID),
  { body: commands },
);

if (data?.length > 0) {
  console.log(`[${actualTime()}] Successfully registered application commands.`);
} else {
  console.error(`[${actualTime()}] Error registering application commands.`);
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  watch(true);
  setInterval(() => {
    watch();
  }, config.REFRESH_INTERVAL);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply({ content: "🏓 Pong!", ephemeral: true });
  } else if (commandName === "update") {
    await interaction.reply({ content: "✅ Devices update started !", ephemeral: true });
    await watch(true);
  }
});

client.login(config.discord.TOKEN);

