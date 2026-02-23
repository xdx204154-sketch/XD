const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const client = new Client({ checkUpdate: false });

// AYARLAR (Render Environment Variables'dan çekilir)
const token = process.env.TOKEN;
const targetName = (process.env.CHANNEL_NAME || "x").toLowerCase(); 
const rawId = process.env.TARGET_USER_ID || "";
const targetUserId = rawId.replace(/\D/g, ""); // ID içindeki rakam dışı her şeyi temizler

let currentChannelId = null;

client.on('ready', async () => {
    console.log(`✅ Sistem Aktif: ${client.user.tag}`);
    
    // mesajlar.txt dosyasını kontrol et ve oku
    if (!fs.existsSync('mesajlar.txt')) {
        console.error("❌ HATA: mesajlar.txt dosyası bulunamadı!");
        process.exit(1);
    }
    const messages = fs.readFileSync('mesajlar.txt', 'utf8').split('\n').filter(l => l.trim());
    let i = 0;

    while (true) {
        try {
            // 1. KANAL BULMA VE TAKİP ETME
            let channel = client.channels.cache.get(currentChannelId);
            
            if (!channel || channel.name.toLowerCase() !== targetName) {
                const targetChannel = client.channels.cache.find(c => 
                    c.name && c.name.toLowerCase() === targetName
                );

                if (targetChannel) {
                    currentChannelId = targetChannel.id;
                    channel = targetChannel;
                    console.log(`🎯 Hedef Kanal Bulundu: #${channel.name} (ID: ${channel.id})`);
                } else {
                    // Kanal yoksa pusuya yat (150ms bekleyip tekrar ara)
                    await new Promise(r => setTimeout(r, 150));
                    continue;
                }
            }

            // 2. MESAJI VE ETİKETİ HAZIRLA
            let anaMesaj = messages[i];
            // Etiketi <@ID> formatında mesajın sonuna yapıştırır
            let finalMsg = targetUserId ? `${anaMesaj} <@${targetUserId}>` : anaMesaj;

            // Yazıyor... efekti
            await channel.sendTyping(); 
            
            // 60-70 WPM İnsansı Yazma Hızı Hesaplama
            let yazmaSuresi = (anaMesaj.length * 75) + Math.floor(Math.random() * 500);
            await new Promise(r => setTimeout(r, yazmaSuresi));

            // 3. MESAJI GÖNDER
            await channel.send(finalMsg);
            console.log(`🚀 Gönderildi: ${anaMesaj.substring(0, 15)}... + Etiket`);

            // Bir sonraki mesaja geç
            i = (i + 1) % messages.length;
            
            // Mesajlar arası çok kısa mola (0.2 saniye)
            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            // --- RATE LIMIT (HIZ SINIRI) KONTROLÜ ---
            if (err.status === 429 || err.message.includes('rate limit')) {
                console.log(`⏳ Discord Hız Sınırı! 2 saniye zorunlu mola...`);
                await new Promise(r => setTimeout(r, 2000));
            } else {
                // Kanalın silinmesi veya yetki hatası gibi durumlarda ID'yi sıfırla
                currentChannelId = null;
                await new Promise(r => setTimeout(r, 300));
            }
        }
    }
});

// Render'ın botu kapatmaması için basit bir web server
require('http').createServer((req, res) => res.end("Bot Aktif")).listen(process.env.PORT || 10000);

client.login(token);
