import { userMention } from "discord.js";
import config from "./config.js";
import sendDiscordMessage from "./utils/sendMessage.js";
import fs from "fs";
import { pingHost, StatusNOKEmbed, StatusOKEmbed } from "./utils/functions.js";

if (!fs.existsSync(config.files.DATA_FOLDER)) {
  fs.mkdirSync(config.files.DATA_FOLDER);
}

if (!fs.existsSync(config.files.DEVICES_FILE)) {
  fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify({}));
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

  let deviceData;

  const data = await readData();

  if (data[device.name]) {
    deviceData = data[device.name];
  }

  if (!data[device.name]) {

    deviceData = {
      alive: res.alive,
      lastPing: res.alive ? Math.floor(Date.now() / 1000) : "",
      ping: res.time,
      ip: device.ip,
      name: device.name
    }

    data[device.name] = {
      alive: null,
      lastPing: res.alive ? Math.floor(Date.now() / 1000) : (data[device.name]?.lastPing || ""),
      ping: res.time,
      ip: device.ip,
      name: device.name
    };
  }



  if (res.alive && (deviceData.alive != res.alive)) {
    sendDiscordMessage([StatusOKEmbed(data[device.name])], `${userMention(config.discord.USER_TO_MENTION_ID)}`);
  } else if (!res.alive && (deviceData.alive != res.alive)) {
    sendDiscordMessage([StatusNOKEmbed(data[device.name])], `${userMention(config.discord.USER_TO_MENTION_ID)}`);
  }

  fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(data));

  return res;
}

async function watch() {

  const devices = config.devices;

  devices.forEach(async (device) => {
    await watchDevice(device);
  }
  );

}

watch();
setInterval(() => {
  watch();
}, config.REFRESH_INTERVAL);