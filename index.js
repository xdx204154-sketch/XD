const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Sistem Aktif!"));
app.listen(PORT, () => console.log(`Sunucu aktif.`));

const tokensRaw = process.env.TOKENS;
const channelId = process.env.CHANNEL_ID;

if (!tokensRaw || !channelId) {
    console.error("HATA: Değişkenler eksik!");
} else {
    // Sadece geçerli uzunluktaki tokenleri al
    const tokenList = tokensRaw.split(/[\s,]+/).filter(t => t.length > 25);
    console.log(`Toplam ${tokenList.length} token denenecek...`);

    tokenList.forEach((token, index) => {
        // GİRİŞLERİ ÇOK YAVAŞLATTIK (Her bot arası 15 saniye)
        setTimeout(() => {
            const client = new Client({ 
                checkUpdate: false,
                // Mobil cihaz gibi görünme ayarı (Kritik)
                ws: { properties: { $os: "iOS", $browser: "Discord iOS", $device: "iPhone" } } 
            });

            client.on('ready', async () => {
                console.log(`✅ [Bot ${index + 1}] Bağlandı: ${client.user.tag}`);
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        await client.voice.joinChannel(channel, { selfMute: true, selfDeaf: true });
                        console.log(`🔊 [Bot ${index + 1}] Seste.`);
                    }
                } catch (e) {
                    console.error(`❌ [Bot ${index + 1}] Ses Hatası.`);
                }
            });

            client.login(token).catch(() => {
                console.error(`⚠️ [Bot ${index + 1}] Engel/Geçersiz: ${token.substring(0, 10)}...`);
            });
        }, index * 15000); 
    });
}
