const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("Sistem Aktif!"));
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));

const tokensRaw = process.env.TOKENS;
const channelId = process.env.CHANNEL_ID;

if (!tokensRaw || !channelId) {
    console.error("HATA: Değişkenler eksik!");
} else {
    // Virgül, boşluk veya alt satır fark etmeksizin tokenleri temizleyerek ayırır
    const tokenList = tokensRaw.split(/[\s,]+/).filter(t => t.length > 20);

    console.log(`Toplam ${tokenList.length} token denenecek...`);

    tokenList.forEach((token, index) => {
        // Discord limitlerine takılmamak için girişleri zamana yayıyoruz (3 saniye arayla)
        setTimeout(() => {
            const client = new Client({ checkUpdate: false });

            client.on('ready', async () => {
                console.log(`✅ [Bot ${index + 1}] Giriş Başarılı: ${client.user.tag}`);
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        await client.voice.joinChannel(channel, { selfMute: true, selfDeaf: true });
                        console.log(`🔊 [Bot ${index + 1}] Ses kanalına girdi.`);
                    }
                } catch (e) {
                    console.error(`❌ [Bot ${index + 1}] Ses Hatası: ${e.message}`);
                }
            });

            // Tokenin sadece başını loglayarak hangi tokenin sorunlu olduğunu gösterir
            client.login(token).catch(() => {
                console.error(`⚠️ [Bot ${index + 1}] Geçersiz! (Token Başı: ${token.substring(0, 15)}...)`);
            });
        }, index * 3000); 
    });
}

// Global hata yakalayıcı (Loglardaki 'reading all' çökmesini engeller)
process.on('unhandledRejection', (error) => {
    if (error.message?.includes('reading \'all\'')) return;
    console.error('Sistem Hatası:', error.message);
});
