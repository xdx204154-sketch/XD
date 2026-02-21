const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

// 1. WEB SUNUCUSU: Render'ın port hatası vermesini ve kapanmasını önler.
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Sistem Aktif: Botlar Ses Kanalında Bekliyor."));
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda başlatıldı.`));

// 2. DEĞİŞKEN KONTROLÜ
const tokensRaw = process.env.TOKENS;
const voiceChannelId = process.env.CHANNEL_ID;

if (!tokensRaw || !voiceChannelId) {
    console.error("HATA: Render panelinde TOKENS veya CHANNEL_ID eksik!");
    process.exit(1); // Değişkenler yoksa sistemi durdurur (Status 1 verir)
}

// Tokenleri virgülle ayırıp temizler
const tokenList = tokensRaw.split(",").map(t => t.trim()).filter(t => t !== "");

console.log(`${tokenList.length} adet token sisteme yükleniyor...`);

// 3. BOTLARI BAŞLATMA DÖNGÜSÜ
tokenList.forEach((token, index) => {
    // Discord'un hesapları banlamaması için her botu 2.5 saniye arayla başlatıyoruz
    setTimeout(() => {
        const client = new Client({ 
            checkUpdate: false,
            patchVoice: true // Ses bağlantısı için kritik ayar
        });

        client.on('ready', async () => {
            console.log(`[Bot ${index + 1}] Aktif: ${client.user.tag}`);
            
            const joinVoice = async () => {
                try {
                    const channel = await client.channels.fetch(voiceChannelId);
                    if (channel && channel.isVoice()) {
                        await client.voice.joinChannel(channel, {
                            selfMute: true,  // Mikrofon kapalı
                            selfDeaf: true,  // Hoparlör kapalı
                            video: false
                        });
                        console.log(`[Bot ${index + 1}] Ses kanalına başarıyla bağlandı.`);
                    } else {
                        console.error(`[Bot ${index + 1}] Kanal bulunamadı veya ses kanalı değil!`);
                    }
                } catch (err) {
                    console.error(`[Bot ${index + 1}] Ses bağlantı hatası: ${err.message}`);
                }
            };

            await joinVoice();

            // Sesten düşerse 10 saniye sonra otomatik tekrar bağlanır
            client.on('voiceStateUpdate', (oldState, newState) => {
                if (newState.id === client.user.id && !newState.channelId) {
                    console.log(`[Bot ${index + 1}] Sesten düşüldü, geri bağlanılıyor...`);
                    setTimeout(() => joinVoice(), 10000);
                }
            });
        });

        client.login(token).catch(err => {
            console.error(`[Bot ${index + 1}] Login Başarısız: Token hatalı veya limitli.`);
        });

    }, index * 2500); 
});

// Hatalarda uygulamanın tamamen çökmesini engeller
process.on('unhandledRejection', (reason, promise) => {
    console.error('Yakalanmayan Hata:', reason);
});
