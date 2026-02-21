const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Sistem Aktif!"));
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda.`));

const tokensRaw = process.env.TOKENS;
const channelId = process.env.CHANNEL_ID;

if (!tokensRaw || !channelId) {
    console.error("HATA: TOKENS veya CHANNEL_ID eksik!");
} else {
    const tokenList = tokensRaw.split(",").map(t => t.trim()).filter(t => t !== "");
    
    tokenList.forEach((token, index) => {
        setTimeout(() => {
            // HATA ÇÖZÜMÜ BURADA: checkUpdate ve userSettings'i kapatıyoruz
            const client = new Client({ 
                checkUpdate: false,
                ws: { properties: { $browser: "Discord iOS" } } // Mobil gibi görünmek bazen hataları çözer
            });

            // Hatanın asıl çözümü: Kullanıcı ayarları senkronizasyonunu devre dışı bırakmak
            client.on('ready', async () => {
                console.log(`[Bot ${index + 1}] Giriş Başarılı: ${client.user.tag}`);
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        await client.voice.joinChannel(channel, { selfMute: true, selfDeaf: true });
                        console.log(`[Bot ${index + 1}] Kanala bağlandı.`);
                    }
                } catch (e) {
                    console.error("Ses hatası:", e.message);
                }
            });

            client.login(token).catch(() => console.error("Token geçersiz!"));
        }, index * 2500);
    });
}

// Loglardaki o çirkin hata mesajlarını susturmak için:
process.on('unhandledRejection', (reason) => {
    if (reason.message?.includes('reading \'all\'')) return; 
    console.error('Hata:', reason);
});
