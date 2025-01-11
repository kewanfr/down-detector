import dotenv from 'dotenv';

dotenv.config();

export default {

  discord: {
    avatarURL: "https://cdn6.aptoide.com/imgs/4/8/a/48a4623c799ef8b7c34c8713b0612440_icon.png",
    webhook: process.env.DISCORD_WEBHOOK_URL,
  },

  REFRESH_INTERVAL: 1000*60*15 // 15 minutes (100ms * 60s * 15min)
}