import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default {
  GMAIL_CODE: process.env.GMAIL_CODE,
  files: {
    DATA_FOLDER: "data",
    DEVICES_FILE: "data/devices.json",
  },

  devices: {
    "NAS": {
      name: "NAS",
      ip: "192.168.0.39"
    },
    "RPI": {
      name: "RPI",
      ip: "192.168.0.40"
    },
    "PVE": {
      name: "PVE",
      ip: "192.168.0.153"
    },
    "VM1 PVE": {
      name: "VM1 PVE",
      ip: "192.168.0.156"
    },
    "VM COURS Mint": {
      name: "VM COURS Mint",
      ip: "192.168.0.134"
    }
  },

  UPDATE_WEBHOOK_URL: process.env.UPDATE_WEBHOOK_URL || "http://192.168.0.40:3000/update",

  discord: {
    CLIENT_ID: "1327786761039904798",
    USER_ID: "355402435893919754",
    GUILD_ID: "704411388549922847",
    TOKEN: process.env.DISCORD_TOKEN,

    status_channel: "status",
    avatarURL: "https://cdn6.aptoide.com/imgs/4/8/a/48a4623c799ef8b7c34c8713b0612440_icon.png",
    webhookURL: process.env.DISCORD_WEBHOOK_URL_,
  },

  PVE: {
    HOST: "192.168.0.153",
    API_ID: process.env.PVE_API_ID,
    API_SECRET: process.env.PVE_API_SECRET,
    VM1: "101",
    MINT: "110"
  },

  REFRESH_INTERVAL: 1000*60*1 // 1 minute (100ms * 60s * 1min)
}