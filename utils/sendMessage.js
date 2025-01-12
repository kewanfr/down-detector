import config from "../config.js";

export default function sendDiscordMessage(embeds, content = null, components = null) {
    var params = {
        username: "Down Detector",
        avatar_url: config.discord.avatarURL,
    }
    if (content){
        params.content = content;
    }
    if (embeds) {
        params.embeds = embeds
    }

    if (components) {
        params.components = components
    }

    fetch(config.discord.webhookURL, {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(async res => {
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`Echec webhook Discord: ${res.status} - ${errText}`);
        }
        console.log("Message envoyé");
    })
}