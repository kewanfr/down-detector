import config from "./config.js";
import sendDiscordMessage from "./utils/sendMessage.js";

async function watch() {


}

watch();
setInterval(() => {
  watch();
}, config.REFRESH_INTERVAL);