const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = require('./config.json'); // Mengambil token dari config.json

// Masukkan token yang Anda dapatkan dari BotFather
const token = config.token;

// Buat bot dengan polling
const bot = new TelegramBot(token, { polling: true });

// Variabel untuk menyimpan header
let header = '';

// Path untuk file JSON pembayaran
const paymentFilePath = './database/payment.json';

// Fungsi untuk menyimpan data ke file JSON
function saveMatchData(matchId, data) {
    const filePath = `./database/${matchId}.json`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Fungsi untuk memuat data dari file JSON
function loadMatchData(matchId) {
    const filePath = `./database/${matchId}.json`;
    if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    }
    return null;
}

// Fungsi untuk menghitung total dari listJumlah
function calculateTotal(listJumlah) {
    return listJumlah.reduce((total, jumlah) => total + jumlah, 0);
}

// Fungsi untuk menyimpan pembayaran
function savePaymentData(paymentText) {
    fs.writeFileSync(paymentFilePath, JSON.stringify({ paymentText }, null, 2));
}

// Fungsi untuk memuat data pembayaran
function loadPaymentData() {
    if (fs.existsSync(paymentFilePath)) {
        const rawData = fs.readFileSync(paymentFilePath);
        return JSON.parse(rawData);
    }
    return null;
}

// Event handler untuk menerima pesan
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Handler untuk perintah /header
    if (text.startsWith('/header ')) {
        const headerText = text.slice(8).replace(/_/g, ' ');
        header = headerText;
        bot.sendMessage(chatId, `Header telah diatur: ${header}`);
    } 
    // Handler untuk perintah /new
    else if (text.startsWith('/new ')) {
        const args = text.slice(5).split(' ');
        const matchId = args[0];
        const matchType = args[1];
        if (matchType === 'bk' || matchType === 'mj') {
            const matchData = {
                id: matchId,
                type: matchType,
                data: matchType === 'mj' ? [
                    {
                        team: 'KIRI',
                        listJumlah: [],
                        listNama: [],
                        total: ''
                    },
                    {
                        team: 'KANAN',
                        listJumlah: [],
                        listNama: [],
                        total: ''
                    }
                ] : []
            };
            saveMatchData(matchId, matchData);
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} dan tipe ${matchType} telah dibuat.`);
        } else {
            bot.sendMessage(chatId, 'Tipe pertandingan harus "bk" atau "mj".');
        }
    } 
    // Handler untuk perintah /rekap
    else if (text.startsWith('/rekap ')) {
        const matchId = text.slice(7);
        const match = loadMatchData(matchId);
        if (match) {
            let response = '';
            if (match.type === 'bk') {
                response += 'NAMA: KECIL\nLIST JUMLAH: [nanti ada angka (list angka)]\nTotal: Menghitung semua total yang ada di list jumlah\n\n';
                response += 'NAMA: KECIL\nLIST JUMLAH: [nanti ada angka (list angka)]\nTotal: Menghitung semua total yang ada di list jumlah\n';
            } else if (match.type === 'mj') {
                match.data.forEach((teamData) => {
                    response += `TIM: ${teamData.team}\nLIST JUMLAH: [${teamData.listJumlah.join(', ')}]\nTotal: ${teamData.total}\nNama: ${teamData.listNama.join(', ')}\n\n`;
                });
            }
            bot.sendMessage(chatId, response);
        } else {
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} tidak ditemukan.`);
        }
    } 
    // Handler untuk perintah /editmj
    else if (text.startsWith('/editmj ')) {
        const args = text.slice(8).split(' ');
        const matchId = args[0];
        const timKiri = args[1].replace(/_/g, ' ');
        const timKanan = args[2].replace(/_/g, ' ');

        const match = loadMatchData(matchId);
        if (match && match.type === 'mj') {
            match.data[0].team = timKiri;
            match.data[1].team = timKanan;
            saveMatchData(matchId, match);
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} telah diperbarui dengan tim baru: ${timKiri} vs ${timKanan}.`);
        } else {
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} tidak ditemukan atau bukan tipe "mj".`);
        }
    } 
    // Handler untuk perintah /addmj
    else if (text.startsWith('/addmj ')) {
        const args = text.slice(7).split(' ');
        const matchId = args[0];
        const teamSide = parseInt(args[1]);
        const nama = args[2].replace(/_/g, ' ');
        const jumlah = parseInt(args[3]);

        const match = loadMatchData(matchId);
        if (match && match.type === 'mj') {
            if (teamSide === 1 || teamSide === 2) {
                const teamIndex = teamSide - 1; // Mengubah 1 atau 2 menjadi indeks 0 atau 1
                match.data[teamIndex].listJumlah.push(jumlah);
                match.data[teamIndex].listNama.push(nama);

                const total = calculateTotal(match.data[teamIndex].listJumlah);
                match.data[teamIndex].total = total.toString();

                saveMatchData(matchId, match);
                bot.sendMessage(chatId, `Nama ${nama} dengan jumlah ${jumlah} telah ditambahkan ke tim ${match.data[teamIndex].team} pada pertandingan ID ${matchId}.`);
            } else {
                bot.sendMessage(chatId, 'Pilihan tim harus 1 (KIRI) atau 2 (KANAN).');
            }
        } else {
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} tidak ditemukan atau bukan tipe "mj".`);
        }
    } 
    // Handler untuk perintah /delmj
    else if (text.startsWith('/delmj ')) {
        const args = text.slice(7).split(' ');
        const matchId = args[0];
        const nama = args[1].replace(/_/g, ' ');
        const jumlah = parseInt(args[2]);

        const match = loadMatchData(matchId);
        if (match && match.type === 'mj') {
            let teamIndex = -1;
            let namaIndex = -1;
            let jumlahIndex = -1;

            // Mencari nama dan jumlah yang sesuai pada tim kiri dan kanan
            match.data.forEach((team, idx) => {
                const tempNamaIndex = team.listNama.indexOf(nama);
                const tempJumlahIndex = team.listJumlah.indexOf(jumlah);

                if (tempNamaIndex > -1 && tempJumlahIndex > -1 && tempNamaIndex === tempJumlahIndex) {
                    teamIndex = idx;
                    namaIndex = tempNamaIndex;
                    jumlahIndex = tempJumlahIndex;
                }
            });

            if (namaIndex > -1 && jumlahIndex > -1) {
                match.data[teamIndex].listNama.splice(namaIndex, 1);
                match.data[teamIndex].listJumlah.splice(jumlahIndex, 1);

                const total = calculateTotal(match.data[teamIndex].listJumlah);
                match.data[teamIndex].total = total.toString();

                saveMatchData(matchId, match);
                bot.sendMessage(chatId, `Nama ${nama} dengan jumlah ${jumlah} telah dihapus dari pertandingan ID ${matchId}.`);
            } else {
                bot.sendMessage(chatId, `Nama ${nama} dengan jumlah ${jumlah} tidak ditemukan di pertandingan ID ${matchId}.`);
            }
        } else {
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} tidak ditemukan atau bukan tipe "mj".`);
        }
    } 
    // Handler untuk perintah /rekaplist
    else if (text.startsWith('/rekaplist ')) {
        const matchId = text.slice(11);
        const match = loadMatchData(matchId);
        if (match) {
            let response = '';
            if (match.type === 'mj') {
                match.data.forEach((teamData) => {
                    response += `TIM: ${teamData.team}\n`;
                    teamData.listNama.forEach((nama, index) => {
                        response += `${nama} (${teamData.listJumlah[index]})\n`;
                    });
                    response += '\n';
                });
            }
            bot.sendMessage(chatId, response);
        } else {
            bot.sendMessage(chatId, `Pertandingan dengan ID ${matchId} tidak ditemukan.`);
        }
    } 
// Handler untuk perintah /payment
else if (text === '/payment') {
    const paymentData = loadPaymentData();
    if (paymentData && paymentData.paymentText) {
        bot.sendMessage(chatId, paymentData.paymentText);
    } else {
        bot.sendMessage(chatId, 'Belum ada data pembayaran.');
    }
} 
// Handler untuk perintah /addpayment
// Handler untuk perintah /addpayment
else if (text.startsWith('/addpayment')) {
    const reply = msg.reply_to_message; // Mengambil pesan yang di-reply
    if (reply && reply.text) {
        const paymentText = reply.text;
        savePaymentData(paymentText);
        bot.sendMessage(chatId, 'Pembayaran telah diperbarui.');
    } else {
        bot.sendMessage(chatId, 'Tidak ada balasan yang ditemukan untuk dijadikan pembayaran.');
    }
}

// Handler untuk perintah /start
else if (text === '/start') {
    bot.sendMessage(chatId, 'Halo! Saya adalah bot Telegram dasar.');
} 
// Handler untuk perintah /help
else if (text === '/help') {
    bot.sendMessage(chatId, 'Berikut adalah perintah yang tersedia:\n/start - Memulai bot\n/help - Bantuan\n/header <teks> - Mengatur header (gunakan _ sebagai pengganti spasi)\n/new <id pertandingan> <bk/mj> - Membuat pertandingan baru\n/rekap <id pertandingan> - Merekap pertandingan\n/editmj <id> <tim kiri> <tim kanan> - Mengubah nama tim untuk pertandingan tipe mj\n/addmj <id> <1/2> <nama> <jumlah> - Menambahkan nama dan jumlah ke pertandingan tipe mj\n/delmj <id> <nama> <jumlah> - Menghapus nama dan jumlah dari pertandingan tipe mj\n/rekaplist <id pertandingan> - Merekap daftar nama dan jumlah dari pertandingan tipe mj\n/payment - Menampilkan data pembayaran terkini\n/addpayment - Mengatur data pembayaran berdasarkan balasan pesan');
} 
// Handler default
else {
    bot.sendMessage(chatId, `Anda mengirim: ${text}`);
}
});

console.log('Bot sudah berjalan...');