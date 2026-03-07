const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Ayarlar (Render env variables) ───
const TOKEN = process.env.TOKEN || '';
const CHANNEL_ID = process.env.TARGET_USER_ID || '';
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'Bilinmiyor';
const WPM = 60;

if (!TOKEN || !CHANNEL_ID) {
    console.error('[X] TOKEN veya TARGET_USER_ID eksik!');
    process.exit(1);
}

// ─── Mesajları dosyadan oku ───
function loadMessages() {
    const filePath = path.join(__dirname, 'mesajlar.txt');
    if (!fs.existsSync(filePath)) {
        console.error('[X] mesajlar.txt bulunamadi!');
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const messages = content.split('\n').map(line => line.trim()).filter(Boolean);
    if (messages.length === 0) {
        console.error('[X] mesajlar.txt bos!');
        process.exit(1);
    }
    return messages;
}

const MESSAGES = loadMessages();
console.log(`[*] ${MESSAGES.length} mesaj yuklendi`);
console.log(`[*] Kanal: ${CHANNEL_NAME} (${CHANNEL_ID})`);
console.log(`[*] Yazim hizi: ${WPM} WPM`);
console.log('[*] Baslatiliyor...\n');

let totalSent = 0;
let messageIndex = 0;

// ─── 60 WPM yazım süresi hesapla ───
function calculateTypingDuration(message) {
    const wordCount = message.length / 5;
    const durationMs = (wordCount / WPM) * 60 * 1000;
    return Math.max(1000, Math.min(durationMs, 25000));
}

// ─── Typing göstergesi gönder ───
async function sendTyping(channelId) {
    try {
        await fetch(`https://discord.com/api/v9/channels/${channelId}/typing`, {
            method: 'POST',
            headers: {
                'Authorization': TOKEN,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });
    } catch (err) {
        console.error('[!] Typing hatasi:', err.message);
    }
}

// ─── Mesaj gönder ───
async function sendMessage(channelId, message) {
    try {
        const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': TOKEN,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ content: message })
        });

        if (res.ok) {
            totalSent++;
            console.log(`[+] Mesaj gonderildi (#${totalSent}): "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
            return true;
        } else {
            const data = await res.json().catch(() => ({}));
            if (res.status === 429) {
                console.log(`[!] Rate limit! 1 saniye bekleniyor...`);
                await sleep(1000);
                return false;
            }
            console.error(`[!] Mesaj gonderilemedi (${res.status}):`, data);
            return false;
        }
    } catch (err) {
        console.error('[!] Mesaj hatasi:', err.message);
        return false;
    }
}

// ─── Bekleme ───
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Ana döngü ───
async function mainLoop() {
    while (true) {
        const message = MESSAGES[messageIndex];
        const typingDuration = calculateTypingDuration(message);

        console.log(`[~] Yaziyor... "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}" (${(typingDuration / 1000).toFixed(1)}s)`);

        // Typing göstergesi - Discord her 10sn'de bir sıfırlar, uzun mesajlarda tekrar gönder
        const typingIntervals = Math.ceil(typingDuration / 9000);
        for (let i = 0; i < typingIntervals; i++) {
            await sendTyping(CHANNEL_ID);
            const waitTime = Math.min(typingDuration - (i * 9000), 9000);
            await sleep(waitTime);
        }

        // Mesajı gönder
        const success = await sendMessage(CHANNEL_ID, message);

        if (success) {
            messageIndex = (messageIndex + 1) % MESSAGES.length;
            // Mesajlar arası doğal bekleme (1-3 saniye)
            const pauseBetween = 1000 + Math.random() * 2000;
            await sleep(pauseBetween);
        }

        if (messageIndex === 0 && success) {
            console.log('[*] Mesajlar bitti, basa sariliyor...\n');
        }
    }
}

mainLoop();

// ─── Health check HTTP server (Render için) ───
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Aktif | Kanal: ${CHANNEL_NAME} | Gonderilen: ${totalSent} | Siradaki: #${messageIndex + 1}/${MESSAGES.length}`);
}).listen(PORT, () => console.log(`[*] Port ${PORT} aktif\n`));
