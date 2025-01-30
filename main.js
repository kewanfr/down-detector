import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  userMention,
  Partials
} from "discord.js";
import config from "./config.js";
import sendDiscordMessage from "./utils/sendMessage.js";
import fs from "fs";
import {
  actualTime,
  fetchStatusMessage,
  pingHost,
  statusButtonsRows,
  statusEmbed,
  StatusNOKEmbed,
  StatusOKEmbed,
} from "./utils/functions.js";
import sendMail from "./utils/sendMail.js";
import proxmoxApi from "proxmox-api";
const {
  Channel,
  GuildMember,
  Message,
  Reaction,
  ThreadMember,
  User,
  GuildScheduledEvent,
} = Partials;

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

  console.log(
    `[${actualTime()}] Device ${device.name} - ${device.ip} is ${
      res.alive ? "alive" : "dead"
    } ${res.alive ? `with a ping of ${res.time}ms` : ""}`
  );

  if (!device.lastPing) {
    device.lastPing = "";
  }

  device.ping = res.time;

  var updated = false;

  if (res.alive && device.alive != res.alive) {
    updated = true;
    sendDiscordMessage(
      [StatusOKEmbed(device)],
      `${userMention(config.discord.USER_ID)}`
    );

    const last_ping = new Date(device.lastPing * 1000);

    const last_ping_str = last_ping.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    });

    var subject = `🟢 [UP] ${device.name} - ${device.ip} est de nouveau en ligne !`;
    var text = `Le serveur ${device.name} - ${device.ip} est de nouveau en ligne !\n\nPing: ${res.time}ms\n\nDernier ping: ${last_ping_str}`;

    sendMail("mail@kewan.fr", subject, text);
  } else if (!res.alive && device.alive != res.alive) {
    updated = true;
    sendDiscordMessage(
      [StatusNOKEmbed(device)],
      `${userMention(config.discord.USER_ID)}`
    );

    const last_ping = new Date(device.lastPing * 1000);

    const last_ping_str = last_ping.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    });
    var subject = `🔴 [DOWN] ${device.name} - ${device.ip} est hors ligne !`;
    var text = `Le serveur ${device.name} - ${device.ip} est <b style="text-decoration: underline;">hors ligne</b> !\n\nDernier ping: ${last_ping_str}`;

    sendMail("mail@kewan.fr", subject, text);
  }

  const data = await readData();
  data[device.name].alive = res.alive;
  data[device.name].ping = res.time;
  data[device.name].lastPing = res.alive
    ? Math.floor(Date.now() / 1000)
    : data[device.name]?.lastPing || "";

  await fs.writeFileSync(config.files.DEVICES_FILE, JSON.stringify(data));

  return updated;
}

async function sendWebhookUpdate() {
  console.log(`[${actualTime()}] Sending update webhook...`);
  return new Promise((resolve, reject) => {
    fetch(config.UPDATE_WEBHOOK_URL, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      }
    }).then(async (res) => {
      if (!res.ok) {
        console.error(
          `[${actualTime()}] Echec webhook Discord: ${res.status} - ${errText}`
        );
        reject(false);
      }
      console.log(`[${actualTime()}] Update Notes envoyé`);
      resolve(true);
    });
  });
}

// const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const client = new Client({
  intents: 3276799,
  partials: [
    Channel,
    GuildMember,
    Message,
    Reaction,
    ThreadMember,
    User,
    GuildScheduledEvent,
  ],
  allowedMentions: { parse: ["everyone", "roles", "users"] },
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const proxmoxClient = proxmoxApi({
  host: config.PVE.HOST,
  tokenID: config.PVE.API_ID,
  tokenSecret: config.PVE.API_SECRET,
  port: config.PVE.PORT
});

const serverAction = async (serverId, action = "start") => {

  var err;
  switch (action) {
    case "start":
      try {
        
        let res = await proxmoxClient.nodes.$("pve").qemu.$(serverId).status.start.$post();
        console.log(res);
        err = false
      } catch (error) {
        err = error
      }
      break;
    
    case "stop":
      try {
        
        let res = await proxmoxClient.nodes.$("pve").qemu.$(serverId).status.stop.$post();
        console.log(res);
        err = false
      } catch (error) {
        err = error
      }
      break;
    
    case "restart":
      try {
        
        let res = await proxmoxClient.nodes.$("pve").qemu.$(serverId).status.reboot.$post();
        console.log(res);
        err = false
      } catch (error) {
        err = error
      }
      break;
  
    default:
      console.log(`Action ${action} inconnue sur la vm ${serverId}`);
      err = true
      break;
  }

  setTimeout(() => {
    watch(true);
  }, 5000);

  return err
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("update")
    .setDescription("Ping all devices and update status message")
    .toJSON(),
];

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
    console.log(
      `[${actualTime()}] Device ${device.name} - ${device.ip} updated: ${res}`
    );
    if (res) {
      updated = true;
    }
  }

  if (updated || updateEmbed) {
    devices = await readData();

    const embed = await statusEmbed(devices);
    const rows = await statusButtonsRows();

    const message = await fetchStatusMessage(client);

    if (message) {
      message.edit({ embeds: [embed], components: rows });
    } else {
      await client.channels.cache
        .find((channel) => channel.name === config.discord.status_channel)
        .send({ embeds: [embed], components: rows });
    }
  }
  return true;
}

const rest = new REST({ version: "10" }).setToken(config.discord.TOKEN);

const data = await rest.put(
  Routes.applicationGuildCommands(
    config.discord.CLIENT_ID,
    config.discord.GUILD_ID
  ),
  { body: commands }
);

if (data?.length > 0) {
  console.log(
    `[${actualTime()}] Successfully registered application commands.`
  );
} else {
  console.error(`[${actualTime()}] Error registering application commands.`);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  watch(true);
  setInterval(() => {
    watch();
  }, config.REFRESH_INTERVAL);
});

client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isButton()) {
    switch (interaction.customId) {
      case "status_update":
        await interaction.deferUpdate();
        await watch(true);
        sendWebhookUpdate();
        break;
      
      case "start_mint":

        await serverAction(config.PVE.MINT, "start");
        await interaction.reply({
          content: "▶️ Lancement de la \`VM MINT\` lancé !",
          ephemeral: true
        });

        break;
      
      case "stop_mint":

        await serverAction(config.PVE.MINT, "stop");
        await interaction.reply({
          content: "🛑 Arret de la \`VM MINT\` lancé !",
          ephemeral: true
        });

        break;
    
      case "restart_mint":
        await serverAction(config.PVE.MINT, "restart");
        await interaction.reply({
          content: "🔃 Redémarrage de la \`VM MINT\` lancé !",
          ephemeral: true
        })

        break;
      
      case "start_vm1":

        await serverAction(config.PVE.VM1, "start");
        await interaction.reply({
          content: "▶️ Lancement de la \`VM1\` lancé !",
          ephemeral: true
        });

        break;
      
      case "stop_vm1":

        await serverAction(config.PVE.VM1, "stop");
        await interaction.reply({
          content: "🛑 Arret de la \`VM1\` lancé !",
          ephemeral: true
        });

        break;
    
      case "restart_vm1":
        await serverAction(config.PVE.VM1, "restart");
        await interaction.reply({
          content: "🔃 Redémarrage de la \`VM1\` lancé !",
          ephemeral: true
        })

        break;
      
    
      default:
        break;
    }
  }

  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  console.log(`Command: ${commandName}`);

  if (commandName === "ping") {
    await interaction.reply({ content: "🏓 Pong!", ephemeral: true });
  } else if (commandName === "update") {
    sendWebhookUpdate();
    await interaction.reply({
      content: "✅ Devices update started !",
      ephemeral: true,
    });
    await watch(true);
  }
});

client.login(config.discord.TOKEN);
