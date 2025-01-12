import { EmbedBuilder, time, TimestampStyles } from "discord.js";
import ping from "ping";
export function StatusOKEmbed(device) {
    const embed = new EmbedBuilder()
        .setTitle(`🟢 ${device.name} est en ligne!`)
        .setDescription(`Le serveur ${device.name} - ${device.ip} est en ligne! \n\nIl répond en **${device.ping.toFixed(1)}**ms.`)

        .setTimestamp();
    
    return embed;
}

export function StatusNOKEmbed(device) {
    // console.log(device, new Date(device.lastPing));
    const embed = new EmbedBuilder()
        .setTitle(`🔴 ${device.name} est hors ligne!`)
        .setDescription(`Le serveur ${device.name} - ${device.ip} est hors ligne!\n\n` + (device.lastPing != "" ? `Il est injoignable depuis ${time(device.lastPing, TimestampStyles.RelativeTime)}` : ""))

        .setTimestamp();
    
    return embed;
}

export function statusEmbed(datas) {
    const embed = new EmbedBuilder()
        .setTitle("Statuts des serveurs")
        .setTimestamp()
        .setColor("Blurple");

    for (const device in datas) {
        if (datas.hasOwnProperty(device)) {
            const data = datas[device];

            embed.addFields({ name: `${data.name} - ${data.ip}`, value: data.alive ? `> 🟢 En ligne | **${data.ping.toFixed(1)}** ms` : (`> 🔴 Hors ligne ` + (data.lastPing != "" ? `depuis ${time(data.lastPing, TimestampStyles.RelativeTime)} !` : "!")) });
        }
    }

    return embed;
}

export async function getStatusChannel(client) {
    var chann = await client.channels.cache.find(channel => channel.name === "status");

    if (!chann) {
        return false;
    }

    return chann;
}

export function fetchStatusMessage(client) {
    return new Promise((resolve, reject) => {
        getStatusChannel(client).then(async (channel) => {
            if (!channel) {
                reject("Channel not found");
            }
            var statusMessage = await channel.messages
            .fetch({})
            .then((msg) =>
              msg
                .filter(
                  (m) =>
                    m.author.id === client.user.id &&
                    m.embeds[0] &&
                    m.embeds[0]?.data?.title == "Statuts des serveurs"
                )
                .first()
            );

            if (statusMessage) {
                resolve(statusMessage);
            }

            resolve(false);

        }).catch((err) => {
            reject(err);
        });
    });
}

export function actualTime() {
    const date = new Date();
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}


export function pingHost(host) {
    return new Promise((resolve, reject) => {
        ping.promise.probe(host)
        .then(function (res) {
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    });
}