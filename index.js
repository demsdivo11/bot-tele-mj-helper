const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Token bot Telegram
const token = require('./config.json').token;
const bot = new TelegramBot(token, { polling: true });

// Path untuk penyimpanan data
const dataPath = './data';

// Fungsi untuk memastikan direktori ada
function ensureDataPath() {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }
}

// Fungsi untuk mengirimkan pesan bantuan
function sendHelpMessage(chatId) {
    const helpText = `
Berikut adalah daftar perintah yang tersedia:

Perintah Daftar:
/add <nama list atau nama pertandingan> <Nama (gunakan _ untuk spasi)> <nominal k/jt (bisa koma atau desimal)> <d/lf/q/dll> - Menambahkan item baru ke daftar
/del <nama> - Menghapus daftar dan semua data terkait
/edit <nama list/nama pertandingan> <nama> <nominal> <sebutan> - Mengedit item di daftar

Perintah Tim:
/kiri <nama team atau sebutan> <pur/normal/dll> <open/close> - Menambahkan atau mengedit tim di sisi kiri
/kanan <nama team atau sebutan> <pur/normal/dll> <open/close> - Menambahkan atau mengedit tim di sisi kanan
/editteam <nama> <pur/normal/dll> <open/close> - Mengedit tim

Perintah Header dan Footer:
/header <text header> - Mengatur teks header
/footer <text footer> - Mengatur teks footer

Perintah Output:
/output <nama pertandingan> - Menampilkan daftar dengan header dan footer
    `;

    bot.sendMessage(chatId, helpText);
}

// Menangani perintah /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    sendHelpMessage(chatId);
});

// Menangani perintah /add
bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const parts = match[1].split(' ');
    const listName = parts[0];
    const name = parts[1];
    const nominal = parts[2];
    const type = parts[3];

    const filePath = path.join(dataPath, `${listName}.json`);
    ensureDataPath();

    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    data[name] = { nominal, type };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    bot.sendMessage(chatId, `Item ${name} telah ditambahkan ke ${listName}`);
});

// Menangani perintah /del
bot.onText(/\/del (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const listName = match[1];
    const filePath = path.join(dataPath, `${listName}.json`);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        bot.sendMessage(chatId, `Daftar ${listName} dan data terkait telah dihapus`);
    } else {
        bot.sendMessage(chatId, `Daftar ${listName} tidak ditemukan`);
    }
});

// Menangani perintah /edit
bot.onText(/\/edit (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const parts = match[1].split(' ');
    const listName = parts[0];
    const name = parts[1];
    const nominal = parts[2];
    const type = parts[3];

    const filePath = path.join(dataPath, `${listName}.json`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data[name]) {
            data[name] = { nominal, type };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            bot.sendMessage(chatId, `Item ${name} di ${listName} telah diperbarui`);
        } else {
            bot.sendMessage(chatId, `Item ${name} tidak ditemukan di ${listName}`);
        }
    } else {
        bot.sendMessage(chatId, `Daftar ${listName} tidak ditemukan`);
    }
});

// Menangani perintah /kiri
bot.onText(/\/kiri (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const parts = match[1].split(' ');
    const name = parts[0];
    const type = parts[1];
    const status = parts[2];

    // Simpan data tim kiri
    const filePath = path.join(dataPath, 'teams.json');
    ensureDataPath();

    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    if (!data.left) data.left = {};
    data.left[name] = { type, status };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    bot.sendMessage(chatId, `Tim ${name} di sisi kiri telah ditambahkan/diubah`);
});

// Menangani perintah /kanan
bot.onText(/\/kanan (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const parts = match[1].split(' ');
    const name = parts[0];
    const type = parts[1];
    const status = parts[2];

    // Simpan data tim kanan
    const filePath = path.join(dataPath, 'teams.json');
    ensureDataPath();

    let data = {};
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    if (!data.right) data.right = {};
    data.right[name] = { type, status };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    bot.sendMessage(chatId, `Tim ${name} di sisi kanan telah ditambahkan/diubah`);
});

// Menangani perintah /editteam
bot.onText(/\/editteam (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const parts = match[1].split(' ');
    const name = parts[0];
    const type = parts[1];
    const status = parts[2];

    const filePath = path.join(dataPath, 'teams.json');
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.left && data.left[name]) {
            data.left[name] = { type, status };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            bot.sendMessage(chatId, `Tim ${name} di sisi kiri telah diperbarui`);
        } else if (data.right && data.right[name]) {
            data.right[name] = { type, status };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            bot.sendMessage(chatId, `Tim ${name} di sisi kanan telah diperbarui`);
        } else {
            bot.sendMessage(chatId, `Tim ${name} tidak ditemukan`);
        }
    } else {
        bot.sendMessage(chatId, `Data tim tidak ditemukan`);
    }
});

// Menangani perintah /header
bot.onText(/\/header (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const headerText = match[1];
    const filePath = path.join(dataPath, 'header.json');

    fs.writeFileSync(filePath, JSON.stringify({ header: headerText }));
    bot.sendMessage(chatId, `Header telah diatur menjadi:\n${headerText}`);
});

// Menangani perintah /footer
bot.onText(/\/footer (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const footerText = match[1];
    const filePath = path.join(dataPath, 'footer.json');

    fs.writeFileSync(filePath, JSON.stringify({ footer: footerText }));
    bot.sendMessage(chatId, `Footer telah diatur menjadi:\n${footerText}`);
});

// Menangani perintah /output
bot.onText(/\/output (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const listName = match[1];
    const listPath = path.join(dataPath, `${listName}.json`);
    const headerPath = path.join(dataPath, 'header.json');
    const footerPath = path.join(dataPath, 'footer.json');
    const teamsPath = path.join(dataPath, 'teams.json');

    let headerData = '';
    let footerData = '';
    let teamsData = { left: {}, right: {} };
    let listData = {};

    if (fs.existsSync(headerPath)) {
        headerData = JSON.parse(fs.readFileSync(headerPath, 'utf8')).header || '';
    }

    if (fs.existsSync(footerPath)) {
        footerData = JSON.parse(fs.readFileSync(footerPath, 'utf8')).footer || '';
    }

    if (fs.existsSync(teamsPath)) {
        teamsData = JSON.parse(fs.readFileSync(teamsPath, 'utf8'));
    }

    if (fs.existsSync(listPath)) {
        listData = JSON.parse(fs.readFileSync(listPath, 'utf8'));
    }

    let output = `${headerData}\n\n`;

    for (const [team, details] of Object.entries(teamsData.left)) {
        output += `${team} (kiri) : ${details.status}\n`;
        for (const [name, item] of Object.entries(listData)) {
            if (item.type === 'd') {
                output += `${name} ${item.nominal} ${item.type}\n`;
            }
        }
    }

    for (const [team, details] of Object.entries(teamsData.right)) {
        output += `${team} (kanan) : ${details.status}\n`;
        for (const [name, item] of Object.entries(listData)) {
            if (item.type === 'd') {
                output += `${name} ${item.nominal} ${item.type}\n`;
            }
        }
    }

    output += `\n${footerData}`;

    bot.sendMessage(chatId, output);
});

// Memastikan direktori data ada
ensureDataPath();
