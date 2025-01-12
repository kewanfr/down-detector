import { Client, Events, GatewayIntentBits, userMention } from "discord.js";
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

  if (res.alive && (device.alive != res.alive)) {
    sendDiscordMessage([StatusOKEmbed(device)], `${userMention(config.discord.USER_TO_MENTION_ID)}`);
  } else if (!res.alive && (device.alive != res.alive)) {
    sendDiscordMessage([StatusNOKEmbed(device)], `${userMention(config.discord.USER_TO_MENTION_ID)}`);
  }

  const data = await readData();
  data[device.name].alive = res.alive;
  data[device.name].ping = res.time;
  data[device.name].lastPing = res.alive ? Math.floor(Date.now() / 1000) : (data[device.name]?.lastPing || "");

  fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(data));

  return res;
}


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function watch() {

  var devices = await readData();


  console.log(`[${actualTime()}] Watching devices...`);
  for (const name in devices) {
    const device = devices[name];
    await watchDevice(device);
  }

  devices = await readData();

  const embed = await statusEmbed(devices);

  const message = await fetchStatusMessage(client);


  if (message) {
    message.edit({ embeds: [embed] });
    return;
  } else {
    await client.channels.cache.find(channel => channel.name === config.discord.status_channel).send({ embeds: [embed] });
  }

}


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
client.login(config.discord.TOKEN);

watch();
setInterval(() => {
  watch();
}, config.REFRESH_INTERVAL);