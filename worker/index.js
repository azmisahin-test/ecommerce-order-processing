// worker\index.js

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const dotenv = require('dotenv');
const WebSocket = require('ws');

// Çevresel değişkenleri yükleyelim
dotenv.config();

// Redis bağlantısı
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Sipariş işleme işçisi
const worker = new Worker('orderQueue', async (job) => {
  const { userId, items, email } = job.data;

  // WebSocket ile sipariş durumu göndermek için
  const wsUrl = `ws://localhost:3000/${job.id}`;
  const ws = new WebSocket(wsUrl);

  // 1. Adım: Ödeme işlemi (Simülasyon)
  console.log(`Ödeme kontrol ediliyor... Kullanıcı: ${userId}`);
  ws.send(JSON.stringify({ status: 'Ödeme alınıyor' }));

  // 2. Adım: Stok kontrolü (Simülasyon)
  let stockAvailable = true; // Stok kontrolü
  items.forEach(item => {
    if (item.quantity > 10) {
      stockAvailable = false;
    }
  });

  // Stok yoksa hata mesajı gönder
  if (!stockAvailable) {
    console.log(`Stok yetersiz!`);
    ws.send(JSON.stringify({ status: 'Stok yetersiz' }));
    await sendEmail(email, 'Stok Yetersiz', 'Ürününüz stokta bulunmamaktadır.');
    return;
  }

  // 3. Adım: Kargo işlemi (Simülasyon)
  console.log('Kargo işlemi başlatılıyor...');
  ws.send(JSON.stringify({ status: 'Kargo hazırlanıyor' }));

  // Kargo başarılı ise kullanıcıya bildirim gönder
  await sendEmail(email, 'Siparişiniz Kargoya Verildi', 'Siparişiniz kargoya verildi.');

}, {
  connection: redisConnection, // Burada connection parametresini doğru şekilde gönderiyoruz.
});

console.log('Sipariş işleme işçisi çalışıyor...');

// E-posta gönderimi
async function sendEmail(to, subject, text) {
  try {
    console.log(`E-posta ${to} gönderildi: ${subject}`, text);
  } catch (error) {
    console.error(`E-posta ${to} gönderilemedi:`, error);
  }
}
