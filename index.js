const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

// Render'ın uyku moduna geçmemesi için basit HTTP sunucusu
app.get("/", (req, res) => res.send("Sistem Aktif: Botlar Seste."));
app.listen(process.env.PORT || 3000, () => console.log("Web sunucusu 3000 portunda hazır."));

const tokens = process.env.TOKENS ? process.env.TOKENS.split(",") : [];
const voiceChannelId = process.env.CHANNEL_ID;

if (tokens.length === 0 || !voiceChannelId) {
    console.error("HATA: TOKENS veya CHANNEL_ID (Environment Variables) eksik!");
    process.exit(1);
}

tokens.forEach((token, index) => {
    const client = new Client({ 
        checkUpdate: false,
        readyStatus: false // Gereksiz logları azaltır
    });

    client.on('ready', async () => {
        console.log(`[Bot ${index + 1}] Giriş Başarılı: ${client.user.tag}`);
        
        try {
            // Ses kanalına bağlanma fonksiyonu
            const joinVoice = async () => {
                const channel = await client.channels.fetch(voiceChannelId);
                if (channel) {
                    // Sese bağlan ve mikrofonu kapat (opsiyonel)
                    await client.voice.joinChannel(channel, {
                        selfMute: true,
                        selfDeaf: true, // Hoparlörü de kapatır (daha az veri tüketimi)
                        video: false
                    });
                    console.log(`[Bot ${index + 1}] Ses kanalına giriş yaptı.`);
                }
            };

            await joinVoice();

            // Eğer kanaldan atılırsa veya bağlantı koparsa tekrar gir
            client.on('voiceStateUpdate', (oldState, newState) => {
                if (newState.id === client.user.id && !newState.channelId) {
                    console.log(`[Bot ${index + 1}] Ses bağlantısı koptu, tekrar bağlanılıyor...`);
                    setTimeout(() => joinVoice(), 5000);
                }
            });

        } catch (err) {
            console.error(`[Bot ${index + 1}] Ses kanalına bağlanırken hata:`, err.message);
        }
    });

    client.login(token.trim()).catch(err => {
        console.error(`[Bot ${index + 1}] Login Hatası! Token geçersiz olabilir.`);
    });
});
