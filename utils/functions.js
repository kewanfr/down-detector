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
        .setTitle("Statut des serveurs")
        .setDescription("Voici le statut des serveurs surveillés")
        .setTimestamp();

    for (const device in datas) {
        if (datas.hasOwnProperty(device)) {
            const data = datas[device];
            embed.addField(`${data.name} - ${data.ip}`, data.alive ? `🟢 En ligne! (**${data.ping.toFixed(1)}**ms)` : (`🔴 Hors ligne` + (data.lastPing != "" ? `depuis ${time(data.lastPing, TimestampStyles.RelativeTime)} !` : " !")));
        }
    }

    return embed;
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