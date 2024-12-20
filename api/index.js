// api\index.js

const cors = require('cors');
const express = require('express');
const { Queue } = require('bullmq');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const IORedis = require('ioredis');  // Redis bağlantısı için ioredis

// Çevresel değişkenleri yükleyelim
dotenv.config();

// Redis bağlantısı
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
console.log("Redis host:", REDIS_HOST);

// Redis bağlantısı oluşturuyoruz
const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Express app
const app = express();

// CORS ayarlarını aktif hale getiriyoruz
app.use(cors({
  origin: '*',  // Burada * yerine güvenli domain belirleyebilirsiniz
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json()); // JSON verisini alabilmek için

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const connections = new Map();

// Sipariş kuyruğu, burada redisConnection kullanıyoruz
const orderQueue = new Queue('orderQueue', {
  connection: redisConnection, // Redis bağlantısını burada kullanıyoruz
});

app.get('/', (req, res) => {
  res.send('Merhaba Dünya!');
})
// Sipariş API
app.post('/order', async (req, res) => {
  const { userId, items, email } = req.body;

  if (!userId || !items || !items.length || !email) {
    return res.status(400).send('Eksik veriler');
  }

  try {
    // Siparişi kuyruğa ekleyelim
    const job = await orderQueue.add('processOrder', {
      userId,
      items,
      email,
    });

    // WebSocket ile kullanıcıya sipariş başlatıldığını bildir
    const client = connections.get(job.id);
    if (client) {
      client.send(JSON.stringify({ status: 'Sipariş alındı', jobId: job.id }));
    }

    res.status(200).send({
      message: 'Sipariş alındı, işlem başlatıldı.',
      jobId: job.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Sipariş işlenirken hata oluştu.');
  }
});

// WebSocket bağlantı kurulumu
wss.on('connection', (ws, req) => {
  const jobId = req.url.split('/').pop(); // URL'den jobId alıyoruz
  connections.set(jobId, ws);

  ws.on('close', () => {
    connections.delete(jobId);
  });
});

// WebSocket dinleme için HTTP server'a bağlanıyoruz
app.server = app.listen(3000, () => {
  console.log('Sunucu çalışıyor: http://localhost:3000');
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
