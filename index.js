const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const http = require('http');

const client = new Client({ checkUpdate: false });

// AYARLAR
const token = process.env.TOKEN;
const targetName = (process.env.CHANNEL_NAME || "x").toLowerCase(); 
const rawId = process.env.TARGET_USER_ID || "";
const targetUserId = rawId.replace(/\D/g, "");

let currentChannelId = null;

// --- RENDER UYKU MODU ENGELLEYİCİ VE WEB SERVER ---
// Bu kısım Render'ın "Inactivity" (Hareketsizlik) nedeniyle botu kapatmasını engeller.
http.createServer((req, res) => {
    res.write("Bot 7/24 Aktif!");
    res.end();
}).listen(process.env.PORT || 10000);

// Kendi kendine istek atarak botu uyanık tutma (Opsiyonel ama etkilidir)
setInterval(() => {
    http.get(`http://localhost:${process.env.PORT || 10000}`);
}, 10 * 60 * 1000); // 10 dakikada bir "tıkla"

client.on('ready', async () => {
    console.log(`✅ Giriş Yapıldı: ${client.user.tag}`);
    runSpammer();
});

async function runSpammer() {
    if (!fs.existsSync('mesajlar.txt')) {
        console.error("❌ HATA: mesajlar.txt bulunamadı!");
        return;
    }

    const messages = fs.readFileSync('mesajlar.txt', 'utf8').split('\n').filter(l => l.trim());
    let i = 0;

    // ANA DÖNGÜ: Hata alsa bile durmaması için While(true) + Try/Catch
    while (true) {
        try {
            let channel = client.channels.cache.get(currentChannelId);
            
            if (!channel || channel.name.toLowerCase() !== targetName) {
                const targetChannel = client.channels.cache.find(c => 
                    c.name && c.name.toLowerCase() === targetName
                );

                if (targetChannel) {
                    currentChannelId = targetChannel.id;
                    channel = targetChannel;
                    console.log(`🎯 Kanal Bulundu: #${channel.name}`);
                } else {
                    await new Promise(r => setTimeout(r, 2000)); // Kanal yoksa 2sn bekle tekrar ara
                    continue;
                }
            }

            let anaMesaj = messages[i];
            let finalMsg = targetUserId ? `${anaMesaj} <@${targetUserId}>` : anaMesaj;

            await channel.sendTyping(); 
            // Daha güvenli yazma süresi (Discord şüphelenmemesi için)
            let yazmaSuresi = (anaMesaj.length * 50) + Math.floor(Math.random() * 500);
            await new Promise(r => setTimeout(r, yazmaSuresi));

            // MESAJI GÖNDER
            await channel.send(finalMsg);
            console.log(`🚀 Gönderildi: ${anaMesaj.substring(0, 20)}...`);

            // İndeksi artır
            i = (i + 1) % messages.length;

            // --- ÖNEMLİ: HIZ SINIRI (RATE LIMIT) KORUMASI ---
            // Çok hızlı mesaj atmak botun 30 dk sonra "Rate Limit" yiyip durmasına neden olur.
            // Aralara 3-5 saniye rastgele bekleme eklemek en sağlıklısıdır.
            let beklemeSuresi = 3000 + Math.floor(Math.random() * 2000); 
            await new Promise(r => setTimeout(r, beklemeSuresi));

        } catch (err) {
            console.error("⚠️ Bir hata oluştu, sistem 5 saniye sonra devam edecek:", err.message);
            currentChannelId = null; // Kanal bilgisini sıfırla ki tekrar arasın
            await new Promise(r => setTimeout(r, 5000)); // Hata sonrası kısa mola
        }
    }
}

// Bot çökerse otomatik yeniden bağlanması için
client.on('error', (e) => console.error("Discord Bağlantı Hatası:", e));
client.on('disconnect', () => console.warn("Bağlantı kesildi, tekrar deneniyor..."));

client.login(token).catch(err => console.error("Giriş Hatası: Token yanlış olabilir."));
