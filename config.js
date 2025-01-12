import dotenv from 'dotenv';

dotenv.config();

export default {

  files: {
    DATA_FOLDER: "data",
    DEVICES_FILE: "data/devices.json",
  },

  devices: [
    {
      name: "RPI",
      ip: "192.168.0.40"
    },
    {
      name: "PVE",
      ip: "192.168.0.153"
    },
    {
      name: "VM1 PVE",
      ip: "192.168.0.156"
    }
  ],

  discord: {
    USER_TO_MENTION_ID: "355402435893919754",
    TOKEN: process.env.DISCORD_TOKEN,
    status_channel: "status",
    avatarURL: "https://cdn6.aptoide.com/imgs/4/8/a/48a4623c799ef8b7c34c8713b0612440_icon.png",
    webhookURL: process.env.DISCORD_WEBHOOK_URL_,
  },

  REFRESH_INTERVAL: 1000*60*5 // 15 minutes (100ms * 60s * 5min)
}