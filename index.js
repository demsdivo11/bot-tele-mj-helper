const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = require('./config.json'); // Mengambil token dari config.json

// Masukkan token yang Anda dapatkan dari BotFather
const token = config.token;

// Buat bot dengan polling
const bot = new TelegramBot(token, { polling: true });

// Variabel untuk menyimpan header
let header = '';

// Event handler untuk menerima pesan
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Handler untuk perintah /header
    if (text.startsWith('/header ')) {
        const headerText = text.slice(8).replace(/_/g, ' ');
        header = headerText;
        bot.sendMessage(chatId, `Header telah diatur: ${header}`);
    } else if (text === '/start') {
        bot.sendMessage(chatId, 'Halo! Saya adalah bot Telegram dasar.');
    } else if (text === '/help') {
        bot.sendMessage(chatId, 'Berikut adalah perintah yang tersedia:\n/start - Memulai bot\n/help - Bantuan\n/header <teks> - Mengatur header (gunakan _ sebagai pengganti spasi)');
    } else {
        bot.sendMessage(chatId, `Anda mengirim: ${text}`);
    }
});

console.log('Bot sudah berjalan...');
