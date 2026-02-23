const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const http = require('http');

const client = new Client({ checkUpdate: false });

const token = process.env.TOKEN;
const targetName = (process.env.CHANNEL_NAME || "x").toLowerCase(); 
const rawId = process.env.TARGET_USER_ID || "";
const targetUserId = rawId.replace(/\D/g, "");

let currentChannelId = null;

// Render'ı uyanık tutmak için basit server
http.createServer((req, res) => { res.write("Aktif"); res.end(); }).listen(process.env.PORT || 10000);

client.on('ready', async () => {
    console.log(`🚀 Hızlı Mod Aktif: ${client.user.tag}`);
    runSpammer();
});

async function runSpammer() {
    if (!fs.existsSync('mesajlar.txt')) return;
    const messages = fs.readFileSync('mesajlar.txt', 'utf8').split('\n').filter(l => l.trim());
    let i = 0;

    while (true) {
        try {
            let channel = client.channels.cache.get(currentChannelId);
            
            if (!channel || channel.name.toLowerCase() !== targetName) {
                const targetChannel = client.channels.cache.find(c => c.name && c.name.toLowerCase() === targetName);
                if (targetChannel) {
                    currentChannelId = targetChannel.id;
                    channel = targetChannel;
                } else {
                    await new Promise(r => setTimeout(r, 150)); // Kanal arama hızı
                    continue;
                }
            }

            let anaMesaj = messages[i];
            let finalMsg = targetUserId ? `${anaMesaj} <@${targetUserId}>` : anaMesaj;

            // Yazma efektini hızlandırdım (daha seri görünür)
            await channel.sendTyping(); 
            await new Promise(r => setTimeout(r, 100)); // Minimum bekleme

            // MESAJI GÖNDER
            await channel.send(finalMsg);
            console.log(`✅ Gönderildi: ${anaMesaj.substring(0, 10)}...`);

            i = (i + 1) % messages.length;

            // --- HIZ AYARI (BURAYI DEĞİŞTİREBİLİRSİN) ---
            // 800ms (0.8 saniye) yaptık. Eğer yine durursa burayı 1500 yapmalısın.
            await new Promise(r => setTimeout(r, 800)); 

        } catch (err) {
            if (err.status === 429) {
                console.log(`⚠️ Hız sınırı! 3 saniye bekleniyor...`);
                await new Promise(r => setTimeout(r, 3000));
            } else {
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
}

client.login(token);
